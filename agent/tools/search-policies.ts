import { defineTool, type ToolContext } from "eve/tools";
import { z } from "zod";

import { shopConfig } from "../../lib/config";
import { fetchPolicyAnswer } from "../../lib/shopify/operations/policies/server";
import { agentProfileUrl } from "../lib/profile";

function answerLanguage(ctx: ToolContext): string {
  return ctx.session.auth.current?.attributes.locale === "ar"
    ? "ar"
    : shopConfig.localization.locale;
}

export default defineTool({
  description:
    "Answer questions about this store's shipping, returns, payments, warranty, sizing, care, contact details, policies, and FAQs.",
  inputSchema: z.strictObject({
    query: z.string().trim().min(1).max(500).describe("The shopper's question."),
  }),
  execute: async ({ query }, ctx) => {
    try {
      return {
        answer: await fetchPolicyAnswer({
          context: { country: shopConfig.localization.country, language: answerLanguage(ctx) },
          profile: agentProfileUrl("ask"),
          query,
        }),
      };
    } catch {
      return { error: "Store policies are unavailable." };
    }
  },
});
