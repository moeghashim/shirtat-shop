import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { roadmapPhases } from "@/lib/roadmap";
import type { RoadmapStatus } from "@/lib/roadmap";

const title = "Shirtat roadmap";
const description = "Where the Shirtat build is: what's done, what's in progress, and what's next.";

export const metadata: Metadata = { title, description };

const columns: RoadmapStatus[] = ["done", "in-progress", "next"];

const labels: Record<RoadmapStatus, string> = {
  done: "Done",
  "in-progress": "In progress",
  next: "Next",
};

export default function RoadmapPage() {
  return (
    <Page>
      <Container className="max-w-5xl">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl md:text-5xl font-semibold">Roadmap</h1>
          <p className="text-muted-foreground">
            How far along the Shirtat build is, phase by phase.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {columns.map((status) => (
            <section key={status} className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4">
              <h2 className="font-semibold">
                {labels[status]}{" "}
                <span className="text-muted-foreground">
                  ({roadmapPhases.filter((phase) => phase.status === status).length})
                </span>
              </h2>
              <ul className="flex flex-col gap-3">
                {roadmapPhases
                  .filter((phase) => phase.status === status)
                  .map((phase) => (
                    <li
                      key={phase.title}
                      className="flex flex-col gap-1 rounded-lg border border-border bg-background p-4"
                    >
                      <h3 className="font-semibold">{phase.title}</h3>
                      <p className="text-sm text-muted-foreground">{phase.summary}</p>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </Container>
    </Page>
  );
}
