import { databaseUrl } from "../src/server/data/source-config.ts";

export function databaseCommandTarget(env: { DATABASE_URL?: string; HYPERDRIVE?: unknown }, allowRemote: boolean) {
  if (env.HYPERDRIVE !== undefined)
    throw new Error("Operations require a direct database URL, not a Hyperdrive binding.");
  const target = new URL(databaseUrl(env, !allowRemote));
  if (target.searchParams.getAll("sslmode").length > 1) throw new Error("Duplicate TLS settings are not allowed.");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
  if (
    !local &&
    (!allowRemote || !["require", "verify-ca", "verify-full"].includes(target.searchParams.get("sslmode") ?? ""))
  )
    throw new Error("Remote operations require --allow-remote and an explicit TLS database URL.");
  if (target.hostname.includes("-pooler.") || target.hostname.includes("hyperdrive"))
    throw new Error("Operations require the direct database endpoint, not a pooling endpoint.");
  return target.href;
}
