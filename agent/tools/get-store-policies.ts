import { defineTool } from "eve/tools";
import { z } from "zod";

import { LEGAL, type LegalSlug } from "../../lib/legal/content";

const TOPICS = ["shipping", "refunds", "terms", "about"] as const satisfies readonly LegalSlug[];

export default defineTool({
  description:
    "Read this store's own shipping, refund and returns, terms, or about policy text in English or Arabic. Use it for delivery times, production time, tracking, customs, returns, cancellations, refunds and sizing policy. Answer only from what it returns.",
  inputSchema: z.strictObject({
    language: z.enum(["en", "ar"]),
    topic: z.enum(TOPICS),
  }),
  execute: ({ language, topic }) => {
    const page = LEGAL[topic][language];
    return {
      intro: page.intro,
      sections: page.sections.map(({ body, heading }) => ({ body: body.join(" "), heading })),
      title: page.title,
    };
  },
});
