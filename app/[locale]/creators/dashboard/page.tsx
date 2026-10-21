import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SubmitDesignForm } from "@/components/creators/forms";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { signOutAction } from "@/lib/creators/actions";
import { getSession } from "@/lib/creators/auth";
import { getCreatorEarnings } from "@/lib/creators/earnings";
import { getCreator } from "@/lib/creators/store";
import { CREATOR_TERMS } from "@/lib/creators/terms";
import { formatLocale, localizePath, type Locale, type Translate } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Creator dashboard"), robots: { index: false } };
}

export default async function DashboardPage() {
  const t = await getT();
  return (
    <Page>
      <Container className="max-w-4xl">
        <h1 className="text-3xl md:text-5xl font-semibold">{t("Creator dashboard")}</h1>
        <Suspense fallback={<p className="mt-8 text-muted-foreground">{t("Loading…")}</p>}>
          <DashboardContent />
        </Suspense>
      </Container>
    </Page>
  );
}

function Stat({ label, value, hint }: { hint?: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold" dir="ltr">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SignOut({ locale, t }: { locale: Locale; t: Translate }) {
  return (
    <form action={signOutAction}>
      <input type="hidden" name="locale" value={locale} />
      <button className="text-sm underline cursor-pointer" type="submit">{t("Sign out")}</button>
    </form>
  );
}

async function DashboardContent() {
  const locale = await getLocale();
  const t = await getT();
  const session = await getSession();
  if (!session) redirect(localizePath(locale, "/creators/signin"));
  if (session.isAdmin) redirect("/admin/creators");
  const creator = await getCreator(session.uid);
  if (!creator) redirect(localizePath(locale, "/creators/apply"));

  if (creator.status !== "approved") {
    return (
      <div className="mt-8 flex flex-col gap-4">
        <p className="text-lg">{t("Hello, {name}.", { name: creator.name })}</p>
        <div className="rounded-2xl border border-border bg-muted/60 p-6">
          <p className="font-semibold">
            {creator.status === "pending" ? t("Your application is under review.") : t("Your application was not approved this time.")}
          </p>
          <p className="mt-2 text-muted-foreground">
            {creator.status === "pending"
              ? t("We review every application by hand. Your dashboard opens as soon as you are approved.")
              : t("Thank you for applying. You are welcome to apply again with new work in the future.")}
          </p>
        </div>
        <SignOut locale={locale} t={t} />
      </div>
    );
  }

  const data = await getCreatorEarnings(creator);
  const money = (n: number) =>
    new Intl.NumberFormat(formatLocale(locale), { style: "currency", currency: data?.currency ?? "USD" }).format(n);
  const num = (n: number) => new Intl.NumberFormat(formatLocale(locale)).format(n);
  const progress = data ? Math.min(100, Math.round((data.quarterUnits / CREATOR_TERMS.topUnitsPerQuarter) * 100)) : 0;

  return (
    <div className="mt-8 flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg">
          {t("Hello, {name}.", { name: creator.name })}{" "}
          <span className="text-muted-foreground" dir="ltr">@{creator.handle}</span>
        </p>
        <SignOut locale={locale} t={t} />
      </div>
      {!data ? (
        <p className="text-muted-foreground">{t("Sales data is temporarily unavailable. Please try again later.")}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label={t("Units sold")} value={num(data.units)} />
            <Stat label={t("Net sales")} value={money(data.netSales)} hint={t("After discounts, excluding tax and shipping.")} />
            <Stat label={t("Earnings")} value={money(data.earnings)} hint={t("At your current rate of {rate}.", { rate: `${Math.round(data.rate * 100)}%` })} />
            <Stat label={t("Pending")} value={money(data.pending)} hint={t("Orders from the last {days} days, still in the hold period.", { days: CREATOR_TERMS.holdDays })} />
            <Stat label={t("Payable")} value={money(data.payable)} hint={t("Paid by the {day}th of the month once over ${min}.", { day: CREATOR_TERMS.payoutDayOfMonth, min: CREATOR_TERMS.minimumPayoutUsd })} />
            <Stat label={t("Tier")} value={data.tier === "top" ? t("Top creator") : t("Standard")} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-medium">
              {t("Progress to the top tier: {units} of {target} units this quarter", { units: num(data.quarterUnits), target: num(CREATOR_TERMS.topUnitsPerQuarter) })}
            </p>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold">{t("Your products")}</h2>
            {data.products.length === 0 ? (
              <p className="text-muted-foreground">{t("No products are linked to your account yet.")}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 text-start font-medium">{t("Product")}</th>
                    <th className="py-2 text-end font-medium">{t("Units")}</th>
                    <th className="py-2 text-end font-medium">{t("Net sales")}</th>
                    <th className="py-2 text-end font-medium">{t("Earnings")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((p) => (
                    <tr key={p.productId} className="border-b">
                      <td className="py-2"><Link className="underline" href={`/products/${p.handle}`}>{p.title}</Link></td>
                      <td className="py-2 text-end" dir="ltr">{num(p.units)}</td>
                      <td className="py-2 text-end" dir="ltr">{money(p.netSales)}</td>
                      <td className="py-2 text-end" dir="ltr">{money(p.netSales * data.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("Figures cover the last {days} days of orders, the furthest back Shopify lets this site read, and update when you reload. Final payouts are confirmed by Shirtat.", { days: data.windowDays })}
          </p>
        </>
      )}
      <section className="flex flex-col gap-4 rounded-2xl border border-border p-6">
        <h2 className="text-2xl font-semibold">{t("Submit a new design")}</h2>
        <SubmitDesignForm />
        {creator.submissions.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {t("Designs submitted so far: {count}", { count: num(creator.submissions.length) })}
          </p>
        )}
      </section>
    </div>
  );
}
