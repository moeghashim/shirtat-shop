import { notFound } from "next/navigation";
import { Suspense } from "react";

import { GuideArticle, GuideArticleSkeleton } from "@/components/guides/article";
import { PHRASE_SLUGS, phraseGuide } from "@/lib/guides/copy";
import { guideMetadata } from "@/lib/guides/meta";
import { getLocale } from "@/lib/i18n/server";

export function generateStaticParams() {
  return PHRASE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/glossary/[slug]">) {
  const { slug } = await params;
  const guide = phraseGuide(slug);
  if (!guide) return {};
  return guideMetadata(guide, await getLocale());
}

export default function PhrasePage({ params }: PageProps<"/[locale]/glossary/[slug]">) {
  return (
    <Suspense fallback={<GuideArticleSkeleton />}>
      <PhrasePageContent params={params} />
    </Suspense>
  );
}

async function PhrasePageContent({
  params,
}: Pick<PageProps<"/[locale]/glossary/[slug]">, "params">) {
  const { slug } = await params;
  const guide = phraseGuide(slug);
  if (!guide) notFound();
  return <GuideArticle guide={guide} locale={await getLocale()} />;
}
