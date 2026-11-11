import type { ShopConfig } from "./types";

const defaultUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

/** Checkout code for shoppers who arrive from an AI assistant. Created in Shopify admin, not in this app. */
export const AI_ASSISTANT_DISCOUNT_CODE = "SHIRTAT-AI";

export const shopConfig = {
  agent: {
    isEnabled: true,
  },
  analytics: {
    shopify: {
      consent: {
        isEnabled: false,
        mode: "default-banner",
      },
      isEnabled: false,
    },
    speedInsights: {
      isEnabled: false,
    },
    vercel: {
      isEnabled: false,
    },
  },
  auth: {
    isEnabled: false,
  },
  botid: {
    checkLevel: "basic",
    isEnabled: false,
  },
  localization: {
    country: "US",
    language: "EN",
    locale: "en-US" as const,
  },
  pdp: {
    bundles: {
      isEnabled: true,
    },
    buyWithShop: {
      isEnabled: true,
    },
    complementaryProducts: {
      isEnabled: true,
    },
    quantityPicker: {
      isEnabled: true,
    },
    relatedProducts: {
      isEnabled: true,
    },
  },
  redirects: {
    shopifyNotFound: {
      isEnabled: false,
    },
  },
  search: {
    isEnabled: true,
  },
  shopify: {
    webmcp: {
      isEnabled: true,
    },
  },
  site: {
    description:
      "Arabic calligraphy apparel: T-shirts, hoodies, sweatshirts, totes and prints with Arabic poetry, humor and culture.",
    name: "Shirtat",
    url: defaultUrl,
  },
} satisfies ShopConfig;

// WebMCP loads on its own, and only in browsers that expose the model-context API.
// Folding it into this flag would also load Shopify's privacy banner and analytics bus.
export const isShopifyScriptsEnabled =
  shopConfig.analytics.shopify.isEnabled || shopConfig.analytics.shopify.consent.isEnabled;
