import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { roadmapPhases } from "@/lib/roadmap";
import type { RoadmapStatus } from "@/lib/roadmap";

const title = "Shirtat roadmap";
const description = "Where the Shirtat build is: what's done, what's in progress, and what's next.";

export const metadata: Metadata = { title, description };

const labels: Record<RoadmapStatus, string> = {
  done: "Done",
  "in-progress": "In progress",
  next: "Next",
};

export default function RoadmapPage() {
  return (
    <Page>
      <Container className="max-w-2xl">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl md:text-5xl font-semibold">Roadmap</h1>
          <p className="text-muted-foreground">
            How far along the Shirtat build is, phase by phase.
          </p>
        </div>
        <ol className="mt-10 flex flex-col gap-6">
          {roadmapPhases.map((phase) => (
            <li
              key={phase.title}
              className="flex flex-col gap-1 rounded-lg border border-border p-5"
            >
              <span className="text-sm text-muted-foreground">{labels[phase.status]}</span>
              <h2 className="font-semibold">{phase.title}</h2>
              <p className="text-muted-foreground">{phase.summary}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Page>
  );
}
