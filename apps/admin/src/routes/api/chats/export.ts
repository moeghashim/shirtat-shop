import { createFileRoute } from "@tanstack/react-router";

const PRIVATE = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };

/** Owner-only download of one reviewed chat turn, exported by the storefront. */
export const Route = createFileRoute("/api/chats/export")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = new URLSearchParams();
        for (const key of ["session", "turn", "version"]) query.set(key, url.searchParams.get(key) ?? "");
        const { storefrontRequest } = await import("@/server/shirtat/storefront.server");
        try {
          const upstream = await storefrontRequest({ path: `/chat-export?${query.toString()}` });
          if (!upstream.ok) return new Response(null, { headers: PRIVATE, status: 404 });
          return new Response(await upstream.text(), {
            headers: {
              ...PRIVATE,
              "content-disposition": upstream.headers.get("content-disposition") ?? "attachment",
              "content-type": "application/json; charset=utf-8",
            },
          });
        } catch {
          return new Response(null, { headers: PRIVATE, status: 404 });
        }
      },
    },
  },
});
