import { timingSafeEqual } from "node:crypto";

import { put } from "@vercel/blob";

import { signedAssetUrl } from "@/lib/creators/tokens";

const MAX_BYTES = 25 * 1024 * 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const URL_TTL_SECONDS = 90 * 24 * 3600;

function authorised(request: Request): boolean {
  const expected = process.env.CUSTOM_ORDER_TOKEN;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || expected.length < 24) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Stores a print-ready PNG for a custom order and returns a long-lived signed URL Printify can fetch. */
export async function POST(request: Request): Promise<Response> {
  if (!authorised(request)) return new Response("Not found", { status: 404 });
  const name = new URL(request.url).searchParams.get("name") ?? "design";
  const body = Buffer.from(await request.arrayBuffer());
  if (body.length === 0 || body.length > MAX_BYTES || !body.subarray(0, 8).equals(PNG_MAGIC))
    return Response.json({ error: "Send a PNG up to 25 MB as the request body." }, { status: 400 });
  const safe = name.replace(/[^\w-]+/g, "_").slice(0, 60) || "design";
  const blob = await put(`uploads/custom/${safe}.png`, body, {
    access: "private",
    addRandomSuffix: true,
    contentType: "image/png",
  });
  return Response.json({
    pathname: blob.pathname,
    url: signedAssetUrl(blob.pathname, URL_TTL_SECONDS),
  });
}
