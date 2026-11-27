"use client";

import { cn } from "cn";
import type { ComponentProps } from "react";

import { formatLocale } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/client";
import { formatPrice } from "@/lib/money";

interface PriceProps extends ComponentProps<"span"> {
  amount: string;
  currencyCode: string;
  formatLocale?: string;
}

export function Price({
  amount,
  className,
  currencyCode,
  formatLocale: localeOverride,
  ...props
}: PriceProps) {
  const locale = useLocale();
  return (
    <span
      className={cn("font-mono text-xl text-foreground tabular-nums tracking-tight", className)}
      {...props}
    >
      {formatPrice({ amount, currencyCode }, localeOverride ?? formatLocale(locale))}
    </span>
  );
}
