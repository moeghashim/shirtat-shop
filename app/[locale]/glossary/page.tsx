import { notFound } from "next/navigation";

import { GuideArticle } from "@/components/guides/article";
import { getGuide } from "@/lib/guides/copy";
import { guideMetadata } from "@/lib/guides/meta";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  const guide = getGuide("/glossary");
  if (!guide) return {};
  return guideMetadata(guide, await getLocale());
}

export default async function GlossaryPage() {
  const guide = getGuide("/glossary");
  if (!guide) notFound();
  return <GuideArticle guide={guide} locale={await getLocale()} />;
}
