import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { DesignerAvatar } from "@/components/designers/avatar";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { listPublicDesigners } from "@/lib/designers/server";
import { getLocale, getT } from "@/lib/i18n/server";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Shop by designer"),
    description: t("Browse Shirtat designs by the designers who made them."),
    alternates: buildAlternates({ locale: await getLocale(), pathname: "/designers" }),
  };
}

export default async function DesignersPage() {
  const t = await getT();
  return (
    <Page>
      <Container className="max-w-5xl">
        <h1 className="text-4xl md:text-5xl font-semibold">{t("Shop by designer")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {t("Browse Shirtat designs by the designers who made them.")}
        </p>
        <Suspense fallback={<p className="mt-10 text-muted-foreground">{t("Loading…")}</p>}>
          <DesignerList />
        </Suspense>
      </Container>
    </Page>
  );
}

async function DesignerList() {
  await connection();
  const t = await getT();
  const designers = await listPublicDesigners().catch(() => []);
  if (designers.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-border p-8">
        <p>{t("Our first designers are on their way.")}</p>
        <Link className="mt-3 inline-block underline" href="/creators">
          {t("Sell on Shirtat")}
        </Link>
      </div>
    );
  }
  return (
    <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {designers.map((d) => (
        <li key={d.handle}>
          <Link
            className="flex items-center gap-4 rounded-2xl border border-border p-5 transition-colors hover:bg-muted/50"
            href={`/designers/${d.handle}`}
          >
            <DesignerAvatar initials={d.initials} name={d.name} size={64} url={d.avatarUrl} />
            <span className="flex flex-col">
              <span className="text-lg font-semibold">{d.name}</span>
              <span className="text-sm text-muted-foreground">
                {d.designCount === 1
                  ? t("1 design")
                  : t("{count} designs", { count: d.designCount })}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
