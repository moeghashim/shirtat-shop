import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { makingOfMilestones } from "@/lib/making-of";
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
  month: "short",
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
            Shirtat is being built in the open with Grok Bot, an AI assistant. This page tracks each
            step as the store takes shape, from an empty shop to Arabic calligraphy on shirts. Check
            back to follow along.
          </p>
        </div>
        <ol className="mt-10 flex flex-col gap-6 border-l border-border pl-6">
          {makingOfMilestones.map((milestone) => (
            <li key={milestone.title} className="flex flex-col gap-1">
              <time dateTime={milestone.date} className="text-sm text-muted-foreground">
                {dateFormat.format(new Date(milestone.date))}
              </time>
              <p>{milestone.title}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Page>
  );
}
