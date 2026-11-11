// Test-only entry; not imported by Vite/Nitro or any production route.
import { readRegistry } from "../src/server/data/registry.ts";
import { databaseUrl } from "../src/server/data/source.ts";
import { getDatabase } from "../src/server/db/client.server.ts";
import { type RuntimeBindings, runtimeEnvironment, withRuntimeRequest } from "../src/server/runtime.server.ts";

export default {
  async fetch(request: Request, env: RuntimeBindings) {
    if (new URL(request.url).pathname === "/favicon.svg") return new Response("ready");
    const req = Object.assign(request, { runtime: { cloudflare: { env } } });
    return withRuntimeRequest(req, async () => {
      if (new URL(request.url).pathname === "/probe") {
        // Compare presence/equality only. Never serialize bindings or credentials.
        // @ts-expect-error Cloudflare's virtual module exists only in this test Worker.
        const { env: imported } = await import("cloudflare:workers");
        const firstDatabase = getDatabase();
        return Response.json({
          binding: !!env.HYPERDRIVE,
          importedBindingMatches:
            imported.HYPERDRIVE?.connectionString ===
            (env.HYPERDRIVE as { connectionString?: string } | undefined)?.connectionString,
          importedSecretMatches: imported.BETTER_AUTH_SECRET === env.BETTER_AUTH_SECRET,
          processSecretMatches: process.env.BETTER_AUTH_SECRET === env.BETTER_AUTH_SECRET,
          effectiveDatabase: !!databaseUrl(runtimeEnvironment()),
          requestDatabaseReused: firstDatabase === getDatabase(),
        });
      }
      const { read, scenario } = (await request.json()) as { read: number; scenario: number };
      const entry = readRegistry[read]?.scenarios[scenario];
      if (!entry) return new Response(null, { status: 400 });
      return Response.json({ demo: await entry.demo(), db: await entry.db() });
    });
  },
};
