import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { databaseUrl } from "../data/source.ts";
import { runtimeEnvironment, workerRequestScope } from "../runtime.server.ts";
import { AsyncLocalStorage } from "node:async_hooks";

// Importing this module never opens a connection. Demo never calls getDatabase.
let client: ReturnType<typeof postgres> | undefined;
const databaseKey = Symbol("request database");
const toolDatabase = new AsyncLocalStorage<ReturnType<typeof drizzle>>();
function createClient(workers: boolean) {
  const url = databaseUrl(runtimeEnvironment());
  return postgres(url, {
    max: workers ? 1 : 4,
    prepare: !url.includes("-pooler"),
    connect_timeout: 3,
    idle_timeout: 5,
    onnotice: () => undefined,
  });
}
function getClient() {
  const scope = workerRequestScope();
  if (scope) {
    let requestClient = scope.resources.get(databaseKey) as ReturnType<typeof postgres> | undefined;
    if (!requestClient) {
      requestClient = createClient(true);
      scope.resources.set(databaseKey, requestClient);
      const owned = requestClient;
      scope.cleanup.push(() => owned.end({ timeout: 1 }));
    }
    return requestClient;
  }
  client ??= createClient(false);
  return client;
}
export function getDatabase() {
  return toolDatabase.getStore() ?? drizzle(getClient());
}

export class DataReadTimeout extends Error {
  constructor() {
    super("Dashboard data read timed out or was cancelled.");
  }
}
export function assertReadActive(signal: AbortSignal, deadline: number) {
  if (signal.aborted || Date.now() >= deadline) throw new DataReadTimeout();
}

// Only tool/refresh callers enter this scope. Ordinary session/admission reads retain
// their existing behavior. No SQL or driver error is exposed at this boundary.
export async function withToolTransaction<T>(
  signal: AbortSignal,
  deadline: number,
  read: () => Promise<T>,
): Promise<T> {
  assertReadActive(signal, deadline);
  if (deadline - Date.now() < 500) throw new DataReadTimeout();
  const pending = new Set<PromiseLike<unknown> & { cancel(): void }>();
  const cancel = () => {
    for (const query of pending) query.cancel();
  };
  const timer = setTimeout(cancel, Math.max(1, deadline - Date.now() - 250));
  signal.addEventListener("abort", cancel, { once: true });
  try {
    const pool = getClient();
    const result = await pool.begin(async (transaction) => {
      assertReadActive(signal, deadline);
      const remainingTimeout = () => {
        assertReadActive(signal, deadline);
        const remaining = Math.floor(deadline - Date.now());
        if (remaining < 500) throw new DataReadTimeout();
        return Math.min(4750, remaining - 250);
      };
      await transaction.unsafe(`SET LOCAL statement_timeout = ${remainingTimeout()}`);
      await transaction.unsafe(`SET LOCAL idle_in_transaction_session_timeout = ${remainingTimeout()}`);
      const [version] = await transaction.unsafe("SHOW server_version_num");
      if (Number(version.server_version_num) >= 170000) {
        await transaction.unsafe(`SET LOCAL transaction_timeout = ${remainingTimeout() + 250}`);
      }
      // Serialize statements and timeout setup together, including reads issued in parallel.
      let tail: Promise<unknown> = Promise.resolve();
      const tracked = new Proxy(transaction, {
        get(target, property, receiver) {
          if (property === "options") return pool.options;
          if (property !== "unsafe") return Reflect.get(target, property, receiver);
          return (...args: Parameters<typeof transaction.unsafe>) => {
            let rows = false;
            const result = tail.then(async () => {
              await transaction.unsafe(`SET LOCAL statement_timeout = ${remainingTimeout()}`);
              assertReadActive(signal, deadline);
              const query = transaction.unsafe(...args);
              pending.add(query);
              try {
                return await (rows ? query.values() : query);
              } finally {
                pending.delete(query);
              }
            });
            tail = result;
            // Drizzle selects values mode synchronously before awaiting its query.
            return Object.assign(result, {
              values() {
                rows = true;
                return result;
              },
            });
          };
        },
      });
      try {
        // Drizzle uses only unsafe() for reads; postgres's TransactionSql deliberately
        // omits pool lifecycle methods from its type.
        const database = drizzle(tracked as unknown as postgres.Sql);
        const value = await toolDatabase.run(database, read);
        assertReadActive(signal, deadline);
        return value;
      } finally {
        cancel();
        await Promise.allSettled([tail, ...pending]);
      }
    });
    assertReadActive(signal, deadline);
    return result as T;
  } catch (error) {
    if (error instanceof DataReadTimeout || signal.aborted || Date.now() >= deadline - 250) throw new DataReadTimeout();
    throw new Error("Unable to load dashboard data. The read failed, was cancelled, or timed out.");
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", cancel);
  }
}
export async function closeDatabase() {
  await client?.end({ timeout: 1 });
  client = undefined;
}
