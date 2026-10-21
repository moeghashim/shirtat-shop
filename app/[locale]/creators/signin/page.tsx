import type { Metadata } from "next";

import { SignInForm } from "@/components/creators/forms";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { getLocale, getT } from "@/lib/i18n/server";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Designer sign in"),
    alternates: buildAlternates({ locale: await getLocale(), pathname: "/creators/signin" }),
    robots: { index: false },
  };
}

export default async function SignInPage() {
  const t = await getT();
  return (
    <Page>
      <Container className="max-w-md">
        <h1 className="mb-8 text-3xl md:text-4xl font-semibold">{t("Designer sign in")}</h1>
        <SignInForm />
      </Container>
    </Page>
  );
}
