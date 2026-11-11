import { notFound } from "next/navigation";
import { Suspense } from "react";

import { GuideArticle, GuideArticleSkeleton } from "@/components/guides/article";
import { SCRIPT_SLUGS, scriptGuide } from "@/lib/guides/copy";
import { guideMetadata } from "@/lib/guides/meta";
import { getLocale } from "@/lib/i18n/server";

export function generateStaticParams() {
  return SCRIPT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/scripts/[slug]">) {
  const { slug } = await params;
  const guide = scriptGuide(slug);
  if (!guide) return {};
  return guideMetadata(guide, await getLocale());
}

export default function ScriptPage({ params }: PageProps<"/[locale]/scripts/[slug]">) {
  return (
    <Suspense fallback={<GuideArticleSkeleton />}>
      <ScriptPageContent params={params} />
    </Suspense>
  );
}

async function ScriptPageContent({
  params,
}: Pick<PageProps<"/[locale]/scripts/[slug]">, "params">) {
  const { slug } = await params;
  const guide = scriptGuide(slug);
  if (!guide) notFound();
  return <GuideArticle guide={guide} locale={await getLocale()} />;
}
