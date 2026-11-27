import { headers } from "next/headers";

import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";

import { commerceFromRequest } from "./index";

export async function commerceLocaleFromHeaders(): Promise<CommerceLocale> {
  const current = await headers();
  return commerceFromRequest(new Request(shopConfig.site.url, { headers: current }));
}
