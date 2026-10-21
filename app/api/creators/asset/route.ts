import { readUpload } from "@/lib/creators/store";
import { verifyAssetSignature } from "@/lib/creators/tokens";

/** Signed, expiring access to a design file (used by Shopify to import the product image). */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const p = url.searchParams.get("p") ?? "";
  if (
    !p.startsWith("uploads/") ||
    !verifyAssetSignature(p, url.searchParams.get("exp") ?? "", url.searchParams.get("sig") ?? "")
  ) {
    return new Response("Not found", { status: 404 });
  }
  const result = await readUpload(p);
  if (!result?.stream) return new Response("Not found", { status: 404 });
  return new Response(result.stream, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": result.blob.contentType ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
