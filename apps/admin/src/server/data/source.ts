import { runtimeEnvironment } from "../runtime.server.ts";
import { selectSource } from "./source-config.ts";

export { type DataEnvironment, type DataSource, databaseUrl, selectSource } from "./source-config.ts";

export async function readSource<T>(demo: () => Promise<T>, db: () => Promise<T>): Promise<T> {
  const source = selectSource(runtimeEnvironment());
  if (source === "demo") return demo();
  try {
    return await db();
  } catch {
    // Deliberately discard the driver error (including SQL, URLs and credentials).
    throw new Error("Unable to load database data. Check the connection and migrations, then retry.");
  }
}
