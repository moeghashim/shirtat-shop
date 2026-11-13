import type { Metadata } from "next";
import Image from "next/image";

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
    description: t(
      "Submit your Arabic calligraphy. It is sold worldwide on the Shirtat website and Etsy, with TikTok Shop and Amazon coming soon. You earn 15–20% of every sale.",
    ),
    alternates: buildAlternates({ locale, pathname: "/creators" }),
  };
}

const CHANNELS = [
  {
    name: "Shirtat",
    src: "/shirtat-logo.svg",
    width: 554,
    height: 461,
    alt: "Shirtat",
    status: "The Shirtat website",
    comingSoon: false,
  },
  {
    name: "Etsy",
    src: "/logos/etsy.svg",
    width: 120,
    height: 120,
    alt: "Etsy",
    status: "Live on Etsy",
    comingSoon: false,
  },
  {
    name: "TikTok Shop",
    src: "/logos/tiktok.svg",
    width: 1000,
    height: 291,
    alt: "TikTok Shop",
    status: "Coming soon",
    comingSoon: true,
  },
  {
    name: "Amazon",
    src: "/logos/amazon.svg",
    width: 603,
    height: 182,
    alt: "Amazon",
    status: "Coming soon",
    comingSoon: true,
  },
] as const;

const STEPS = [
  {
    title: "Apply",
    body: "Apply with a few sample designs and links to your work.",
  },
  {
    title: "We review",
    body: "We review every application by hand and reply within a few days.",
  },
  {
    title: "Sold worldwide",
    body: "Once approved, your designs go on Shirtat products and are listed on our sales channels. Shirtat covers printing, inventory, payments, shipping and customer service, and you earn a share of every sale.",
  },
] as const;

const BENEFITS = [
  {
    title: "Worldwide shipping",
    body: "Print-on-demand partners print each order and ship to the countries they cover. Your design can be worn around the world, and you do not run a warehouse.",
  },
  {
    title: "No inventory",
    body: "You do not buy stock or pack orders. Shirtat prints each piece as the order comes in.",
  },
  {
    title: "A royalty on every sale",
    body: "You earn 15% of the net item price, or 20% if you sell 50 or more units in a calendar quarter. The rate never falls below 15%.",
  },
] as const;

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
      <Container className="max-w-5xl">
        <section className="flex flex-col gap-6 md:max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("Sell on Shirtat")}
          </p>
          <h1 className="text-4xl font-semibold md:text-6xl">{t("Your design, sold worldwide")}</h1>
          <p className="text-lg text-muted-foreground">
            {t(
              "Submit your Arabic calligraphy. Shirtat prints it on demand, ships it around the world, and lists it on the Shirtat website and Etsy — with TikTok Shop and Amazon coming soon. You earn a royalty on every sale, and you never hold inventory.",
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-foreground px-6 py-3 font-medium text-background"
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

        <section className="mt-20 flex flex-col gap-6">
          <div className="md:max-w-3xl">
            <h2 className="text-2xl font-semibold md:text-3xl">{t("Where your design sells")}</h2>
            <p className="mt-3 text-muted-foreground">
              {t(
                "Approved designs are sold today on the Shirtat website and on Etsy. TikTok Shop and Amazon are coming soon.",
              )}
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CHANNELS.map((channel) => (
              <li key={channel.name}>
                <article className="flex h-full flex-col gap-4 rounded-2xl border border-border p-5">
                  <div className="flex h-16 items-center justify-center rounded-xl bg-[#f6f1e8] px-4">
                    <Image
                      alt={t(channel.alt)}
                      className="h-9 w-auto max-w-[8.5rem] object-contain"
                      height={channel.height}
                      src={channel.src}
                      unoptimized
                      width={channel.width}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{t(channel.name)}</h3>
                    {channel.comingSoon ? (
                      <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {t("Coming soon")}
                      </span>
                    ) : null}
                  </div>
                  {channel.comingSoon ? null : (
                    <p className="text-sm text-muted-foreground">{t(channel.status)}</p>
                  )}
                </article>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-20 flex flex-col gap-6">
          <h2 className="text-2xl font-semibold md:text-3xl">{t("How it works")}</h2>
          <ol className="grid gap-3 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                className="flex h-full flex-col gap-3 rounded-2xl border border-border p-6"
                key={step.title}
              >
                <p className="flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                  {index + 1}
                </p>
                <h3 className="text-lg font-semibold">{t(step.title)}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{t(step.body)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-20 flex flex-col gap-6">
          <h2 className="text-2xl font-semibold md:text-3xl">
            {t("Why designers sell on Shirtat")}
          </h2>
          <ul className="grid gap-3 md:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <li
                className="flex h-full flex-col gap-2 rounded-2xl border border-border p-6"
                key={benefit.title}
              >
                <h3 className="text-lg font-semibold">{t(benefit.title)}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{t(benefit.body)}</p>
              </li>
            ))}
          </ul>
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

        <section className="mt-20 flex flex-col gap-4 md:max-w-3xl">
          <h2 className="text-2xl font-semibold md:text-3xl">{t("Terms at a glance")}</h2>
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

        <section className="mt-20 flex flex-col gap-6 md:max-w-3xl">
          <h2 className="text-2xl font-semibold md:text-3xl">{t("FAQ")}</h2>
          {FAQ.map(([q, a]) => (
            <div className="flex flex-col gap-1" key={q}>
              <h3 className="font-semibold">{t(q)}</h3>
              <p className="text-muted-foreground">{t(a)}</p>
            </div>
          ))}
        </section>

        <section className="mt-20 mb-8 rounded-2xl bg-muted/60 px-8 py-12 text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">
            {t("Ready to sell your design worldwide?")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            {t(
              "Apply with a few designs. If you are approved, Shirtat prints, lists and ships them, and you earn a royalty on every sale.",
            )}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              className="inline-block rounded-full bg-foreground px-6 py-3 font-medium text-background"
              href="/creators/apply"
            >
              {t("Apply now")}
            </Link>
            <Link
              className="inline-block rounded-full border border-border px-6 py-3 font-medium"
              href="/creators/signin"
            >
              {t("Designer sign in")}
            </Link>
          </div>
        </section>
      </Container>
    </Page>
  );
}
