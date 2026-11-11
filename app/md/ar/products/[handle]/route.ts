import { productMarkdownResponse } from "@/lib/markdown/product/server";

export function generateStaticParams(): Array<{ handle: string }> {
  return [];
}

export function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> },
): Promise<Response> {
  return params.then(({ handle }) => productMarkdownResponse(handle, "ar"));
}
