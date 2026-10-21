import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/creators/forms";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { peekResetToken } from "@/lib/creators/store";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Choose a new password"), robots: { index: false, follow: false } };
}

export default async function ResetPage({ searchParams }: PageProps<"/[locale]/creators/reset">) {
  const t = await getT();
  return (
    <Page>
      <Container className="max-w-md">
        <h1 className="mb-8 text-3xl md:text-4xl font-semibold">{t("Choose a new password")}</h1>
        <Suspense fallback={null}>
          <ResetBody searchParams={searchParams} />
        </Suspense>
      </Container>
    </Page>
  );
}

async function ResetBody({
  searchParams,
}: Pick<PageProps<"/[locale]/creators/reset">, "searchParams">) {
  const t = await getT();
  const raw = (await searchParams).t;
  const token = typeof raw === "string" ? raw.slice(0, 100) : "";
  if (!token || !(await peekResetToken(token))) {
    return (
      <div className="flex flex-col gap-4">
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {t("This link has expired or is invalid. Ask us for a new one.")}
        </p>
        <Link className="underline" href="/creators/forgot">
          {t("Send reset link")}
        </Link>
      </div>
    );
  }
  return <ResetPasswordForm token={token} />;
}
