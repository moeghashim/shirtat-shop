import { productMarkdownResponse } from "@/lib/markdown/product/server";

// Stored per path. Locale is the path, not a request header: reading headers here is a 500 under Cache Components.
export function generateStaticParams(): Array<{ handle: string }> {
  return [];
}

export function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> },
): Promise<Response> {
  return params.then(({ handle }) => productMarkdownResponse(handle, "en"));
}
