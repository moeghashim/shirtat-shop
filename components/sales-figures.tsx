import { getSalesFigures } from "@/lib/sales/server";
import type { SalesTotals } from "@/lib/sales/server";

export async function SalesFigures() {
  const figures = await getSalesFigures();
  if (!figures) {
    return <p className="text-muted-foreground">Sales figures coming soon.</p>;
  }
  const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: figures.currency });
  const row = (label: string, t: SalesTotals) => (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-5">
      <h2 className="font-semibold">{label}</h2>
      <dl className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Orders</dt>
          <dd className="text-2xl font-semibold">{t.orders}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Revenue</dt>
          <dd className="text-2xl font-semibold">{money.format(t.revenue)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Units sold</dt>
          <dd className="text-2xl font-semibold">{t.units}</dd>
        </div>
      </dl>
    </div>
  );
  return (
    <div className="flex flex-col gap-6">
      {row("All time", figures.allTime)}
      {row("Last 30 days", figures.last30Days)}
    </div>
  );
}
