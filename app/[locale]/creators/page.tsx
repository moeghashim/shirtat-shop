import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { CREATOR_TERMS } from "@/lib/creators/terms";
import { getLocale, getT } from "@/lib/i18n/server";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const locale = await getLocale();
  return {
    title: t("Sell on Shirtat"),
    description: t("Submit your Arabic calligraphy designs and earn 15–20% of every sale."),
    alternates: buildAlternates({ locale, pathname: "/creators" }),
  };
}

const FAQ = [
  [
    "Who can apply?",
    "Any designer or calligrapher whose original work celebrates Arabic script. You must own the rights to the designs you submit.",
  ],
  [
    "Do I keep the rights to my designs?",
    "Yes. The licence is non-exclusive: you keep ownership and can sell your work elsewhere. You give Shirtat the right to print and sell the approved designs while they are listed.",
  ],
  [
    "How is my share calculated?",
    "On the net item price: what the customer paid for your product after discounts, excluding tax and shipping. Refunds are deducted, and cancelled orders are not paid.",
  ],
  [
    "When do I get paid?",
    "Earnings are held for 30 days to cover returns, then paid monthly by the 15th once your balance reaches $25. Smaller balances roll over.",
  ],
  [
    "How do I reach the top tier?",
    "Sell 50 or more units in a calendar quarter and your rate becomes 20% for that quarter.",
  ],
  [
    "Can the terms change?",
    "Only with 60 days' notice, never retroactively, and the base rate will never fall below 15%.",
  ],
] as const;

export default async function CreatorsPage() {
  const t = await getT();
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const terms = [
    t("Payouts monthly, by the {day}th, for earnings older than {days} days.", {
      day: CREATOR_TERMS.payoutDayOfMonth,
      days: CREATOR_TERMS.holdDays,
    }),
    t("Minimum payout ${amount}; smaller balances roll over to the next month.", {
      amount: CREATOR_TERMS.minimumPayoutUsd,
    }),
    t("Paid by PayPal or Wise, your choice."),
    t("Refunded items are deducted from your net sales and earnings."),
    t("Non-exclusive: you keep the rights and can sell your work anywhere."),
    t("You must own the rights to every design you submit."),
    t(
      "Changes need {days} days' notice, are never retroactive, and the rate never drops below {floor}.",
      { days: CREATOR_TERMS.noticeDays, floor: pct(CREATOR_TERMS.rateFloor) },
    ),
  ];
  return (
    <Page>
      <Container className="max-w-3xl">
        <section className="flex flex-col gap-5">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("Sell on Shirtat")}
          </p>
          <h1 className="text-4xl md:text-6xl font-semibold">
            {t("Your calligraphy, worn around the world")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t(
              "Submit your Arabic calligraphy designs. We print, sell and ship them, and you earn a share of every sale.",
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-foreground px-6 py-3 text-background font-medium"
              href="/creators/apply"
            >
              {t("Apply now")}
            </Link>
            <Link
              className="rounded-full border border-border px-6 py-3 font-medium"
              href="/creators/signin"
            >
              {t("Designer sign in")}
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-border p-6">
            <p className="text-5xl font-semibold">{pct(CREATOR_TERMS.baseRate)}</p>
            <p className="mt-2 font-medium">{t("Standard rate")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Of the net item price after discounts, excluding tax and shipping.")}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/60 p-6">
            <p className="text-5xl font-semibold">{pct(CREATOR_TERMS.topRate)}</p>
            <p className="mt-2 font-medium">{t("Top designer rate")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("For designers who sell {units} or more units in a calendar quarter.", {
                units: CREATOR_TERMS.topUnitsPerQuarter,
              })}
            </p>
          </div>
        </section>

        <section className="mt-16 flex flex-col gap-4">
          <h2 className="text-2xl md:text-3xl font-semibold">{t("How it works")}</h2>
          <ol className="flex flex-col gap-3 list-decimal ps-5">
            <li>{t("Apply with a few sample designs and links to your work.")}</li>
            <li>{t("We review every application by hand and reply within a few days.")}</li>
            <li>
              {t(
                "Once approved, your designs go on Shirtat products. Shirtat covers printing, stock, payments, shipping and customer service.",
              )}
            </li>
            <li>{t("Track your sales and earnings in your designer dashboard.")}</li>
          </ol>
        </section>

        <section className="mt-16 flex flex-col gap-4">
          <h2 className="text-2xl md:text-3xl font-semibold">{t("Terms at a glance")}</h2>
          <ul className="flex flex-col gap-2 list-disc ps-5">
            {terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
          <p className="text-sm">
            <Link className="underline" href="/creators/terms">
              {t("Read the full designer terms")}
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            {t(
              "Example: a T-shirt sells for $33.99 with a $5 discount. The net item price is $28.99, so you earn $4.35 at 15% or $5.80 at 20%.",
            )}
          </p>
        </section>

        <section className="mt-16 flex flex-col gap-6">
          <h2 className="text-2xl md:text-3xl font-semibold">{t("FAQ")}</h2>
          {FAQ.map(([q, a]) => (
            <div key={q} className="flex flex-col gap-1">
              <h3 className="font-semibold">{t(q)}</h3>
              <p className="text-muted-foreground">{t(a)}</p>
            </div>
          ))}
        </section>

        <section className="mt-16 rounded-2xl bg-muted/60 p-8 text-center">
          <h2 className="text-2xl font-semibold">{t("Ready to share your work?")}</h2>
          <Link
            className="mt-5 inline-block rounded-full bg-foreground px-6 py-3 text-background font-medium"
            href="/creators/apply"
          >
            {t("Apply now")}
          </Link>
        </section>
      </Container>
    </Page>
  );
}
