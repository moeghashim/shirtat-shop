import { DashboardCard, SectionHeader, StatCard } from "@/components/blocks";
import { CardContent } from "@/components/ui/card";

export function CardsExample() {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      <DashboardCard>
        <SectionHeader
          title="Standard card"
          level={3}
          description="A heading, supporting text and an action slot."
          actions={
            <a className="text-primary text-sm underline underline-offset-4" href="#data-table">
              View table example
            </a>
          }
        />
        <CardContent>
          Use standard density for a main section. Compose the content with existing UI primitives.
        </CardContent>
      </DashboardCard>
      <DashboardCard density="compact">
        <SectionHeader title="Compact card" level={3} />
        <CardContent>
          Use compact density for a smaller supporting section. Data and behavior stay with the caller.
        </CardContent>
      </DashboardCard>
      <StatCard label="Open requests" level={3} value="24" />
      <StatCard
        label="Completed requests"
        level={3}
        value="86"
        density="compact"
        trend={<span className="text-success text-sm">12 more this week</span>}
        help="Illustrative weekly total, with an optional trend and help text."
      />
    </div>
  );
}
