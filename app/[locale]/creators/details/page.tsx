import type { Metadata } from "next";
import { Suspense } from "react";

import { DetailsForm } from "@/components/creators/forms";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { getCreator } from "@/lib/creators/store";
import { checkDetailsToken, parseDetailsToken } from "@/lib/creators/tokens";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Creator details"), robots: { index: false, follow: false } };
}

export default async function DetailsPage({
  searchParams,
}: PageProps<"/[locale]/creators/details">) {
  const t = await getT();
  return (
    <Page>
      <Container className="max-w-2xl">
        <h1 className="mb-3 text-3xl md:text-4xl font-semibold">{t("Creator details")}</h1>
        <p className="mb-8 text-muted-foreground">
          {t(
            "We use these details to pay you and to keep our tax records correct. Only the Shirtat team can see them.",
          )}
        </p>
        <Suspense fallback={null}>
          <DetailsBody searchParams={searchParams} />
        </Suspense>
      </Container>
    </Page>
  );
}

async function DetailsBody({
  searchParams,
}: Pick<PageProps<"/[locale]/creators/details">, "searchParams">) {
  const t = await getT();
  const raw = (await searchParams).t;
  const token = typeof raw === "string" ? raw : "";
  const parsed = parseDetailsToken(token);
  const creator = parsed ? await getCreator(parsed.id) : null;
  if (
    !parsed ||
    !creator ||
    creator.status !== "approved" ||
    !checkDetailsToken(creator, parsed.raw)
  ) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
      >
        {t("This link has expired or is invalid. Ask us for a new one.")}
      </p>
    );
  }
  return <DetailsForm token={token} />;
}
