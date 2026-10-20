import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { logDays } from "@/lib/log";

const title = "Shirtat build log";
const description = "A daily log of what was done to build Shirtat.";

export const metadata: Metadata = { title, description };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default function LogPage() {
  return (
    <Page>
      <Container className="max-w-2xl">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl md:text-5xl font-semibold">Daily log</h1>
          <p className="text-muted-foreground">What got done each day, newest first.</p>
        </div>
        <div className="mt-10 flex flex-col gap-10">
          {logDays.map((day) => (
            <section key={day.date} className="flex flex-col gap-3">
              <h2 className="font-semibold">
                <time dateTime={day.date}>{dateFormat.format(new Date(day.date))}</time>
              </h2>
              <ul className="list-disc pl-5 flex flex-col gap-1">
                {day.entries.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Container>
    </Page>
  );
}
