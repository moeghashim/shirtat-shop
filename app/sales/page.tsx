import type { Metadata } from "next";
import { Suspense } from "react";

import { SalesFigures } from "@/components/sales-figures";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";

const title = "Shirtat sales";
const description = "Shirtat's sales in the open: total orders, revenue, and units sold.";

export const metadata: Metadata = { title, description };

export default function SalesPage() {
  return (
    <Page>
      <Container className="max-w-2xl">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl md:text-5xl font-semibold">Sales in the open</h1>
          <p className="text-muted-foreground">
            Totals only, updated about once an hour. Figures cover the last 60 days, the furthest
            back Shopify lets this site read. No customer details are ever shown.
          </p>
        </div>
        <div className="mt-10">
          <Suspense fallback={<p className="text-muted-foreground">Loading sales figures...</p>}>
            <SalesFigures />
          </Suspense>
        </div>
      </Container>
    </Page>
  );
}
