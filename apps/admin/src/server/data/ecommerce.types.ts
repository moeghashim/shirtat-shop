import type { OrderRow } from "../../routes/(main)/dashboard/ecommerce/-components/recent-orders-table/schema.ts";
export type EcommerceData = {
  metrics: { label: string; value: string; change: string; help: string; positive: boolean }[];
  revenueOverviewData: { period: string; revenue: number; profit: number }[];
  trafficData: { timestamp: string; visitors: number; anomalies: number }[];
  categories: { name: string; share: number }[];
  products: { name: string; category: string; share: string; sales: string }[];
  trafficSources: {
    name: string;
    visits: string;
    share: number;
    change: string;
    icon: "siMeta" | "siGoogle" | "siShopify" | "siTiktok" | "siEbay";
  }[];
  customerInitials: string[];
  chartData: { month: string; "in-stock": number; "low-stock": number; "out-of-stock": number }[];
  orders: OrderRow[];
  reportDate: string;
  revenueCaption: string;
  summary: {
    storeVisits: number;
    sourceVisits: number;
    topSalesShare: number;
    reviewAverage: number;
    reviewCount: number;
    reviewExtra: number;
  };
  review: { id: string; author: string; rating: number; body: string };
};
