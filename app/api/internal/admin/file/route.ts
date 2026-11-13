import { connection } from "next/server";

import { PRIVATE_HEADERS, authorizeAdminRequest, notFound } from "@/lib/admin-api/request";
import { readUpload } from "@/lib/creators/store";

/** Streams a private designer upload to the admin app. */
export async function GET(request: Request): Promise<Response> {
  await connection();
  const authorized = await authorizeAdminRequest(request);
  if (!authorized) return notFound();
  const pathname = authorized.url.searchParams.get("p") ?? "";
  if (!pathname.startsWith("uploads/") || pathname.includes("..")) return notFound();
  const result = await readUpload(pathname).catch(() => null);
  if (!result?.stream) return notFound();
  return new Response(result.stream, {
    headers: {
      ...PRIVATE_HEADERS,
      "content-disposition": "inline",
      "content-security-policy": "sandbox",
      "content-type": result.blob.contentType ?? "application/octet-stream",
    },
  });
}
