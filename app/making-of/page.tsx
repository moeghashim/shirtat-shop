import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { logDays } from "@/lib/log";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

const title = "The making of Shirtat";
const description =
  "Follow along as Shirtat is built with Grok Bot, an AI assistant, one milestone at a time.";

export const metadata: Metadata = {
  title,
  description,
  alternates: buildAlternates({ pathname: "/making-of" }),
  openGraph: buildOpenGraph({ title, description, url: "/making-of", type: "website" }),
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default function MakingOfPage() {
  return (
    <Page>
      <Container className="max-w-2xl">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl md:text-5xl font-semibold">{title}</h1>
          <p className="text-muted-foreground">
            Shirtat is being built in the open with Grok Bot, an AI assistant, and is now live at
            shirtat.co. The daily log below records each step, from an empty shop to Arabic
            calligraphy on shirts. This website is fully managed by Grok Bot.
          </p>
        </div>
        <section className="mt-12 flex flex-col gap-8">
          <h2 className="text-2xl font-semibold">Daily log</h2>
          {logDays.map((day) => (
            <div key={day.date} className="flex flex-col gap-3">
              <h3 className="font-semibold">
                <time dateTime={day.date}>{dateFormat.format(new Date(day.date))}</time>
              </h3>
              <ul className="flex flex-col gap-1 list-disc pl-5">
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
