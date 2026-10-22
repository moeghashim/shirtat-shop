import { getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BlogIndex, BlogIndexSkeleton } from "@/components/blog/blog-index";
import { getBlog } from "@/lib/blog/server";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getShopifySitemapPage } from "@/lib/seo/server";
import { PLACEHOLDER_HANDLE } from "@/lib/static-params";

export async function generateStaticParams() {
  try {
    const { items } = await getShopifySitemapPage("BLOG", 1);
    const first = items[0];
    return [{ blogHandle: first ? first.handle : PLACEHOLDER_HANDLE }];
  } catch {
    return [{ blogHandle: PLACEHOLDER_HANDLE }];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blogs/[blogHandle]">): Promise<Metadata> {
  const { blogHandle } = await params;
  if (blogHandle === PLACEHOLDER_HANDLE) return {};
  const blog = await getBlog({
    handle: blogHandle,
  });
  if (!blog) notFound();
  const pathname = `/blogs/${blog.handle}`;
  return {
    alternates: buildAlternates({ pathname }),
    description: blog.seo.description,
    openGraph: buildOpenGraph({ locale: await getLocale(),
      description: blog.seo.description,
      title: blog.seo.title,
      type: "website",
      url: pathname,
    }),
    title: blog.seo.title,
  };
}

export default function BlogPage({ params }: PageProps<"/[locale]/blogs/[blogHandle]">) {
  return (
    <Suspense fallback={<BlogIndexSkeleton />}>
      <BlogPageContent params={params} />
    </Suspense>
  );
}

async function BlogPageContent({
  params,
}: Pick<PageProps<"/[locale]/blogs/[blogHandle]">, "params">) {
  const { blogHandle } = await params;
  if (blogHandle === PLACEHOLDER_HANDLE) notFound();
  const blog = await getBlog({
    handle: blogHandle,
  });
  if (!blog) notFound();
  return <BlogIndex blog={blog} />;
}
