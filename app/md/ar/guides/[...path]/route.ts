import { guideMarkdownResponse } from "@/lib/markdown/guide/server";

export function generateStaticParams(): Array<{ path: string[] }> {
  return [];
}

export function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  return params.then(({ path }) => guideMarkdownResponse(path, "ar"));
}
