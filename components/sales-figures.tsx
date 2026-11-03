import { formatLocale } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import { getSalesFigures } from "@/lib/sales/server";
import type { SalesTotals } from "@/lib/sales/server";

export async function SalesFigures() {
  const figures = await getSalesFigures();
  const t = await getT();
  const locale = await getLocale();
  if (!figures) {
    return <p className="text-muted-foreground">{t("Sales figures coming soon.")}</p>;
  }
  const numbers = locale === "ar" ? "ar-u-nu-latn" : formatLocale(locale);
  const money = new Intl.NumberFormat(numbers, { style: "currency", currency: figures.currency });
  const row = (label: string, tot: SalesTotals) => (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-5">
      <h2 className="font-semibold">{label}</h2>
      <dl className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <dt className="text-muted-foreground">{t("Orders")}</dt>
          <dd className="text-2xl font-semibold">{tot.orders}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("Revenue")}</dt>
          <dd className="text-2xl font-semibold">{money.format(tot.revenue)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("Units sold")}</dt>
          <dd className="text-2xl font-semibold">{tot.units}</dd>
        </div>
      </dl>
    </div>
  );
  return (
    <div className="flex flex-col gap-6">
      {row(t("Last 60 days"), figures.last60Days)}
      {row(t("Last 30 days"), figures.last30Days)}
      <p className="text-sm text-muted-foreground">
        {t("Revenue in US dollars, converted at each order date's exchange rate.")}
      </p>
    </div>
  );
}
