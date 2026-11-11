import { notFound } from "next/navigation";

import { GuideArticle } from "@/components/guides/article";
import { getGuide } from "@/lib/guides/copy";
import { guideMetadata } from "@/lib/guides/meta";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  const guide = getGuide("/eid-gift-t-shirt");
  if (!guide) return {};
  return guideMetadata(guide, await getLocale());
}

export default async function EidGiftPage() {
  const guide = getGuide("/eid-gift-t-shirt");
  if (!guide) notFound();
  return <GuideArticle guide={guide} locale={await getLocale()} />;
}
