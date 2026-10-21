import { formatMoney } from "@shopify/hydrogen";

import { shopConfig } from "@/lib/config";
import type { Money } from "@/lib/money/types";

import { DISPLAY_CURRENCY, toUsdAmount } from "./fx";

/** Converts store-currency (GBP) money to the USD display currency. */
export function toDisplayMoney(money: Money): Money {
  if (money.currencyCode !== "GBP") return money;
  return { amount: toUsdAmount(money.amount, "GBP").toFixed(2), currencyCode: DISPLAY_CURRENCY } as Money;
}

export function formatCurrencySymbol(
  currencyCode: string,
  locale: string = shopConfig.localization.locale,
): string {
  const code = currencyCode === "GBP" ? DISPLAY_CURRENCY : currencyCode;
  return formatMoney({ amount: "0", currencyCode: code } as Money, { locale }).currencySymbol;
}

export function formatPrice(money: Money, locale: string = shopConfig.localization.locale): string {
  return formatMoney(toDisplayMoney(money), { locale }).localizedString;
}
