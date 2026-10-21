import { formatMoney } from "@shopify/hydrogen";

import { shopConfig } from "@/lib/config";
import type { Money } from "@/lib/money/types";

// The Shopify store currency is USD, so prices are shown as Shopify returns them.

export function formatCurrencySymbol(
  currencyCode: string,
  locale: string = shopConfig.localization.locale,
): string {
  return formatMoney({ amount: "0", currencyCode } as Money, { locale }).currencySymbol;
}

export function formatPrice(money: Money, locale: string = shopConfig.localization.locale): string {
  return formatMoney(money, { locale }).localizedString;
}
