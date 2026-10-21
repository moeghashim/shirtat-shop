import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { getLocale, getT } from "@/lib/i18n/server";
import { logDays } from "@/lib/log";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

const TITLE = "The making of Shirtat";
const DESCRIPTION =
  "Follow along as Shirtat is built with Grok Bot, an AI assistant, one milestone at a time.";
const INTRO =
  "Shirtat is being built in the open with Grok Bot, an AI assistant, and is now live at shirtat.co. The daily log below records each step, from an empty shop to Arabic calligraphy on shirts. This website is fully managed by Grok Bot.";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const locale = await getLocale();
  const title = t(TITLE);
  const description = t(DESCRIPTION);
  return {
    title,
    description,
    alternates: buildAlternates({ locale, pathname: "/making-of" }),
    openGraph: buildOpenGraph({ title, description, url: "/making-of", type: "website" }),
  };
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default async function MakingOfPage() {
  const t = await getT();
  const locale = await getLocale();
  return (
    <Page>
      <Container className="max-w-2xl">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl md:text-5xl font-semibold">{t(TITLE)}</h1>
          <p className="text-muted-foreground">{t(INTRO)}</p>
          {locale === "ar" && (
            <p className="text-sm text-muted-foreground">
              {t("The daily log is kept in English.")}
            </p>
          )}
        </div>
        {/* The daily log stays English-only. */}
        <section className="mt-12 flex flex-col gap-8" lang="en" dir="ltr">
          <h2 className="text-2xl font-semibold font-sans">Daily log</h2>
          {logDays.map((day) => (
            <div key={day.date} className="flex flex-col gap-3 font-sans">
              <h3 className="font-semibold">
                <time dateTime={day.date}>{dateFormat.format(new Date(day.date))}</time>
              </h3>
              <ul className="flex flex-col gap-1 list-disc ps-5">
                {day.entries.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </Container>
    </Page>
  );
}
