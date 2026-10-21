import { getSession } from "@/lib/creators/auth";
import { readUpload } from "@/lib/creators/store";

/** Streams a private design upload to the admin or the creator who uploaded it. */
export async function GET(request: Request): Promise<Response> {
  const pathname = new URL(request.url).searchParams.get("p") ?? "";
  const session = await getSession();
  if (!session || !pathname.startsWith("uploads/"))
    return new Response("Not found", { status: 404 });
  if (!session.isAdmin && !pathname.startsWith(`uploads/${session.uid}/`)) {
    return new Response("Not found", { status: 404 });
  }
  const result = await readUpload(pathname);
  if (!result?.stream) return new Response("Not found", { status: 404 });
  return new Response(result.stream, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      "Content-Type": result.blob.contentType ?? "application/octet-stream",
      "Content-Security-Policy": "sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
