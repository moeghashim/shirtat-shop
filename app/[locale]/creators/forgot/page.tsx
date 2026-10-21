import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/creators/forms";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Reset your password"), robots: { index: false } };
}

export default async function ForgotPage() {
  const t = await getT();
  return (
    <Page>
      <Container className="max-w-md">
        <h1 className="mb-3 text-3xl md:text-4xl font-semibold">{t("Reset your password")}</h1>
        <p className="mb-8 text-muted-foreground">
          {t(
            "Enter the email you signed up with and we will send you a link to choose a new password.",
          )}
        </p>
        <ForgotPasswordForm />
      </Container>
    </Page>
  );
}
