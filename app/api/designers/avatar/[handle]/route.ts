import { listCreators, readUpload } from "@/lib/creators/store";
import { avatarOf } from "@/lib/designers/server";

/** Public logo or profile picture of an approved designer. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> },
): Promise<Response> {
  const { handle } = await params;
  const c = (await listCreators()).find((x) => x.status === "approved" && x.handle === handle);
  const avatar = c ? avatarOf(c) : null;
  if (!avatar || !["image/png", "image/jpeg", "image/webp"].includes(avatar.contentType)) {
    return new Response("Not found", { status: 404 });
  }
  const result = await readUpload(avatar.pathname);
  if (!result?.stream) return new Response("Not found", { status: 404 });
  return new Response(result.stream, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": avatar.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
