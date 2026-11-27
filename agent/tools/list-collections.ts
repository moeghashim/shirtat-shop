import { defineTool } from "eve/tools";
import { z } from "zod";

import { fetchCollections } from "../../lib/shopify/operations/collections/server";
import { shopperCommerce } from "../lib/market";

export default defineTool({
  description: "List this store's collection handles, titles and short descriptions.",
  inputSchema: z.strictObject({}),
  execute: async (_input, ctx) => ({
    collections: (await fetchCollections({ locale: shopperCommerce(ctx) })).map(
      ({ description, handle, title }) => ({
        description: description.slice(0, 160),
        handle,
        title,
      }),
    ),
  }),
});
