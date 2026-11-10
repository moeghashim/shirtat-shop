import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";

import { RichTextPage, RichTextPageSkeleton } from "@/components/content/rich-text-page";
import { localizePath } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import { getPage } from "@/lib/pages/server";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getShopifySitemapPage } from "@/lib/seo/server";
import { PLACEHOLDER_HANDLE } from "@/lib/static-params";

export async function generateStaticParams() {
  try {
    const { items } = await getShopifySitemapPage("PAGE", 1);
    const first = items[0];
    return [{ handle: first ? first.handle : PLACEHOLDER_HANDLE }];
  } catch {
    return [{ handle: PLACEHOLDER_HANDLE }];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/pages/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  if (handle === PLACEHOLDER_HANDLE) return {};
  if (handle === "contact") return { robots: { follow: false, index: false } };
  const page = await getPage({
    handle,
  });
  if (!page) notFound();
  const pathname = `/pages/${page.handle}`;
  const t = await getT();
  const title = t(page.seo.title);
  return {
    alternates: buildAlternates({ locale: await getLocale(), pathname }),
    description: page.seo.description,
    openGraph: buildOpenGraph({
      locale: await getLocale(),
      description: page.seo.description,
      title,
      type: "website",
      url: pathname,
    }),
    title,
  };
}

export default function ShopifyPage({ params }: PageProps<"/[locale]/pages/[handle]">) {
  return (
    <Suspense fallback={<RichTextPageSkeleton />}>
      <ShopifyPageContent params={params} />
    </Suspense>
  );
}

async function ShopifyPageContent({
  params,
}: Pick<PageProps<"/[locale]/pages/[handle]">, "params">) {
  const { handle } = await params;
  if (handle === PLACEHOLDER_HANDLE) notFound();
  if (handle === "contact") permanentRedirect(localizePath(await getLocale(), "/contact"));
  const page = await getPage({
    handle,
  });
  if (!page) notFound();
  const t = await getT();
  return <RichTextPage body={page.body} title={t(page.title)} />;
}
