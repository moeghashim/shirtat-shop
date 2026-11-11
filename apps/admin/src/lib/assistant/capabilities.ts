export const projectionCatalog = [
  {
    domain: "default",
    metric: "performance",
    label: "Customer and account counts",
    periodLabel: "Available performance observations",
  },
  {
    domain: "analytics",
    metric: "traffic-quality",
    label: "Traffic quality index",
    periodLabel: "Available traffic quality observations",
  },
  {
    domain: "finance",
    metric: "transaction-overview",
    label: "Transaction expenses",
    periodLabel: "Available expense observations",
  },
  { domain: "crm", metric: "pipeline", label: "Qualified opportunities", periodLabel: "Available pipeline months" },
  {
    domain: "ecommerce",
    metric: "revenue",
    label: "Revenue and profit (USD)",
    periodLabel: "Available reporting periods",
  },
] as const;

export const dashboardFilters = { range: ["available"], segment: ["all"] } as const;
