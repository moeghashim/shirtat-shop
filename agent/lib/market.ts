import type { ToolContext } from "eve/tools";

import { resolveCommerceCountry } from "../../lib/commerce";
import type { CommerceLocale } from "../../lib/config/types";

export function shopperCommerce(ctx: ToolContext): CommerceLocale {
  const attributes = ctx.session.auth.current?.attributes;
  const locale = attributes?.locale;
  return {
    country: resolveCommerceCountry(
      typeof attributes?.country === "string" ? attributes.country : null,
    ),
    language: locale === "ar" ? "AR" : "EN",
  };
}
