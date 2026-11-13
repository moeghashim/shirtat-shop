import { createFileRoute } from "@tanstack/react-router";

const PRIVATE = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };

/** Owner-only proxy for private designer uploads stored by the storefront. */
export const Route = createFileRoute("/api/designers/file")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const pathname = new URL(request.url).searchParams.get("p") ?? "";
        if (!pathname.startsWith("uploads/") || pathname.includes("..")) return new Response(null, { status: 404 });
        const { storefrontRequest } = await import("@/server/shirtat/storefront.server");
        try {
          const upstream = await storefrontRequest({ path: `/file?p=${encodeURIComponent(pathname)}` });
          if (!upstream.ok || !upstream.body) return new Response(null, { headers: PRIVATE, status: 404 });
          return new Response(upstream.body, {
            headers: {
              ...PRIVATE,
              "content-disposition": "inline",
              "content-security-policy": "sandbox",
              "content-type": upstream.headers.get("content-type") ?? "application/octet-stream",
            },
          });
        } catch {
          return new Response(null, { headers: PRIVATE, status: 404 });
        }
      },
    },
  },
});
