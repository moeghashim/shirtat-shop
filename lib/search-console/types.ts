export interface SearchTotals {
  clicks: number;
  ctr: number;
  impressions: number;
  position: number;
}

export interface SearchRow extends SearchTotals {
  key: string;
}

export interface SearchSlice {
  byCountry: SearchRow[];
  byPage: SearchRow[];
  state: "no-data" | "ok" | "unavailable";
  totals?: SearchTotals;
}

export interface SitemapIndexReading {
  errors?: number;
  indexed?: number;
  path?: string;
  state: "no-data" | "ok" | "unavailable";
  submitted?: number;
  warnings?: number;
}

export interface GscReading {
  code?: "invalid-window";
  end?: string;
  image?: SearchSlice;
  sitemaps?: SitemapIndexReading;
  start?: string;
  state: "error" | "not-connected" | "ok";
  web?: SearchSlice;
}
