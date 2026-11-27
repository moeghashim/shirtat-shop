import { defineDynamic, defineInstructions } from "eve/instructions";

import { resolveCommerceCountry } from "../../lib/commerce";

export default defineDynamic({
  events: {
    "turn.started": (_event, ctx) => {
      const country = resolveCommerceCountry(
        typeof ctx.session.auth.current?.attributes.country === "string"
          ? ctx.session.auth.current.attributes.country
          : null,
      );
      return defineInstructions({
        content: `Shopper country for this turn: ${country}. Set catalog.context.address_country to ${country}. Quote currencyCode from tool results. Do not convert prices.`,
        role: "user",
      });
    },
  },
});
