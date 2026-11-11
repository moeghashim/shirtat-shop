import { createFileRoute } from "@tanstack/react-router";

import { CardsExample } from "./-components/cards-example";
import cardsSource from "./-components/cards-example?raw";
import { ChartExample } from "./-components/chart-example";
import chartSource from "./-components/chart-example?raw";
import { ExampleSource } from "./-components/example-source";
import { HeaderExample } from "./-components/header-example";
import headerSource from "./-components/header-example?raw";
import { RegistryInstall } from "./-components/registry-install";
import { TableExample } from "./-components/table-example";
import tableSource from "./-components/table-example?raw";

export const Route = createFileRoute("/(main)/dashboard/kit/")({ component: KitPage });

function KitPage() {
  return (
    <div className="min-w-0 space-y-8">
      <HeaderExample />
      <nav aria-label="Block examples" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {[
          ["page-header", "PageHeader"],
          ["cards", "Cards and sections"],
          ["charts", "Charts"],
          ["data-table", "DataTable"],
        ].map(([id, title]) => (
          <a key={id} href={`#${id}`} className="text-primary rounded-sm underline underline-offset-4">
            {title}
          </a>
        ))}
      </nav>
      <section id="page-header" aria-labelledby="page-header-title" className="scroll-mt-20 space-y-4">
        <h2 id="page-header-title" className="text-lg font-medium">
          PageHeader
        </h2>
        <p className="text-muted-foreground max-w-prose">
          The heading above is a live PageHeader. Toggle its description to try the minimal variant. Use it once per
          page; keep controls in the actions slot.
        </p>
        <ExampleSource name="PageHeader" source={headerSource} />
        <RegistryInstall section="page-header" />
      </section>
      <section id="cards" aria-labelledby="cards-title" className="scroll-mt-20 space-y-4 border-t pt-6">
        <h2 id="cards-title" className="text-lg font-medium">
          DashboardCard, SectionHeader and StatCard
        </h2>
        <p className="text-muted-foreground max-w-prose">
          Standard and compact density share the same tokens. SectionHeader supports h2 or h3; these examples use h3
          beneath the section heading. StatCard accepts a value, trend and supporting text.
        </p>
        <CardsExample />
        <ExampleSource name="Cards" source={cardsSource} />
        <RegistryInstall section="cards" />
      </section>
      <section id="charts" aria-labelledby="charts-title" className="scroll-mt-20 space-y-4 border-t pt-6">
        <h2 id="charts-title" className="text-lg font-medium">
          DashboardChart, DashboardTooltip and DashboardLegend
        </h2>
        <p className="text-muted-foreground max-w-prose">
          Use chartAxis, chartGrid and chartCursor for shared styling, seriesConfig for distinct colors and line
          patterns, and useChartMotion for every animated mark and tooltip. Compare one or two series; the data table
          provides an exact alternative.
        </p>
        <ChartExample />
        <ExampleSource name="Charts" source={chartSource} />
        <RegistryInstall section="charts" />
      </section>
      <section id="data-table" aria-labelledby="data-table-title" className="scroll-mt-20 space-y-4 border-t pt-6">
        <h2 id="data-table-title" className="text-lg font-medium">
          DataTable
        </h2>
        <p className="text-muted-foreground max-w-prose">
          Sort a column, change pages or try the empty state. On narrow screens, labelled fields retain every value;
          toggle mobile reflow to use horizontal scrolling. The caller owns the table instance and its data.
        </p>
        <TableExample />
        <ExampleSource name="DataTable" source={tableSource} />
        <RegistryInstall section="data-table" />
      </section>
    </div>
  );
}
