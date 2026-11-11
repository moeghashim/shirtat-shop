import { notFound } from "next/navigation";

import { GuideArticle } from "@/components/guides/article";
import { SCRIPT_SLUGS, scriptGuide } from "@/lib/guides/copy";
import { guideMetadata } from "@/lib/guides/meta";
import { getLocale } from "@/lib/i18n/server";

export function generateStaticParams() {
  return SCRIPT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = scriptGuide(slug);
  if (!guide) return {};
  return guideMetadata(guide, await getLocale());
}

export default async function ScriptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = scriptGuide(slug);
  if (!guide) notFound();
  return <GuideArticle guide={guide} locale={await getLocale()} />;
}
