export type DataSource = "demo" | "db";
export type DataEnvironment = { DATABASE_URL?: string; DATA_SOURCE?: string };

export function selectSource(env: DataEnvironment): DataSource {
  if (env.DATA_SOURCE !== undefined && env.DATA_SOURCE !== "demo") {
    throw new Error("Unsupported DATA_SOURCE. Use demo or leave it unset.");
  }
  if (env.DATA_SOURCE === "demo") return "demo";
  return env.DATABASE_URL === undefined ? "demo" : "db";
}

export function databaseUrl(env: DataEnvironment, localOnly = false): string {
  try {
    const url = new URL(env.DATABASE_URL ?? "");
    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      !url.username ||
      !url.password ||
      url.pathname.length < 2
    )
      throw new Error();
    if (localOnly && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new Error();
    return url.href;
  } catch {
    throw new Error(
      localOnly
        ? "Database commands require an explicit local Postgres DATABASE_URL."
        : "Database configuration is invalid.",
    );
  }
}
