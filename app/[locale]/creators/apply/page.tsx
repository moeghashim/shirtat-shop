import type { Metadata } from "next";

import { ApplyForm } from "@/components/creators/forms";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { getLocale, getT } from "@/lib/i18n/server";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Apply to become a designer"),
    alternates: buildAlternates({ locale: await getLocale(), pathname: "/creators/apply" }),
  };
}

export default async function ApplyPage() {
  const t = await getT();
  return (
    <Page>
      <Container className="max-w-2xl">
        <h1 className="text-3xl md:text-5xl font-semibold">{t("Apply to become a designer")}</h1>
        <p className="mt-3 mb-10 text-muted-foreground">
          {t(
            "Tell us about yourself and share a few designs. Every application is reviewed by hand.",
          )}
        </p>
        <ApplyForm />
      </Container>
    </Page>
  );
}
