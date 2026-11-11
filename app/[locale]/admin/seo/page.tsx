import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { SeoDashboard } from "@/components/admin/seo-dashboard";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { getSession } from "@/lib/creators/auth";
import { localizePath } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import { seoDashboardAccess } from "@/lib/seo-plan/access";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    robots: { follow: false, index: false },
    title: t("SEO plan"),
  };
}

export default function SeoPlanPage() {
  return (
    <Page>
      <Container>
        <Suspense fallback={<SeoPlanFallback />}>
          <SeoPlanGate />
        </Suspense>
      </Container>
    </Page>
  );
}

// SHIRTAT_ADMIN_URL, when it is another origin, sends owners to the Shirtat admin app. Unset keeps this page.
function shirtatAdminUrl(): string | null {
  const value = process.env.SHIRTAT_ADMIN_URL?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password)
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

async function SeoPlanGate() {
  await connection();
  const session = await getSession();
  const locale = await getLocale();
  if (!seoDashboardAccess(session)) redirect(localizePath(locale, "/creators/signin"));
  const target = shirtatAdminUrl();
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (target && host && new URL(target).host !== host) redirect(target);
  const t = await getT();
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold">{t("SEO plan")}</h1>
        <p className="max-w-3xl text-sm leading-6 text-foreground/80">
          {t(
            "Owner only. Search Console, the published catalog and the sitemap load from this server. Task statuses are edited in the plan file.",
          )}
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href="/admin/creators">{t("Designers admin")}</Link>
          <Link href="/admin/chats">{t("Chat review")}</Link>
          <a href="/admin/seo" hrefLang="en" lang="en">
            English
          </a>
          <a className="font-arabic" href="/ar/admin/seo" hrefLang="ar" lang="ar">
            العربية
          </a>
        </p>
      </div>
      <SeoDashboard />
    </div>
  );
}

function SeoPlanFallback() {
  return (
    <div aria-busy="true" className="grid gap-6">
      <div className="grid gap-2">
        <div className="h-9 w-48 rounded-xl bg-[#f6f1e8]" />
        <div className="h-12 max-w-3xl rounded-xl bg-[#f6f1e8]" />
      </div>
      <div className="h-40 rounded-2xl bg-[#f6f1e8]" />
      <div className="h-56 rounded-2xl bg-[#f6f1e8]" />
    </div>
  );
}
