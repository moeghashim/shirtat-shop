// Test-only adapter: Wrangler synthesizes cf-connecting-ip for missing headers.
// Strip it immediately before the real built entry to exercise production fallback.
// @ts-expect-error Generated server module has no declaration file.
import app from "../.output/server/index.mjs";

export default {
  fetch(request: Request, env: unknown, context: unknown) {
    const headers = new Headers(request.headers);
    headers.delete("cf-connecting-ip");
    return app.fetch(new Request(request, { headers }), env, context);
  },
};
