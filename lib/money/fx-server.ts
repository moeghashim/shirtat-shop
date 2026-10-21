import { cacheLife } from "next/cache";

import { fetchGbpUsdRate } from "./fx";

export async function getCachedGbpUsdRate(): Promise<number | null> {
  "use cache";
  cacheLife("hours");
  return fetchGbpUsdRate();
}
