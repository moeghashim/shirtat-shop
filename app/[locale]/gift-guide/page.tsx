import { GuideArticle } from "@/components/guides/article";
import { GIFT_GUIDE } from "@/lib/guides/gift";
import { guideMetadata } from "@/lib/guides/meta";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  return guideMetadata(GIFT_GUIDE, await getLocale());
}

export default async function GiftGuidePage() {
  return <GuideArticle guide={GIFT_GUIDE} locale={await getLocale()} />;
}
