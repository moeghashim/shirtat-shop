import { withBotId } from "botid/next/config";
import { withEve } from "eve/next";
import type { NextConfig } from "next";

import { shopConfig } from "./lib/config";
import { withShopConfig } from "./lib/config/server";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    globalNotFound: true,
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  async redirects() {
    return [
      { destination: "/making-of", permanent: true, source: "/log" },
      {
        destination: "/collections/posters-prints",
        permanent: true,
        source: "/collections/prints",
      },
      {
        destination: "/collections/posters-prints",
        permanent: true,
        source: "/collections/prints/",
      },
      {
        destination: "/ar/collections/posters-prints",
        permanent: true,
        source: "/ar/collections/prints",
      },
      {
        destination: "/ar/collections/posters-prints",
        permanent: true,
        source: "/ar/collections/prints/",
      },
      {
        destination: "/collections/posters-prints",
        permanent: true,
        source: "/en/collections/prints",
      },
    ];
  },
  images: {
    // Small widths so phones don't download 1320px+ images (Lighthouse LCP).
    deviceSizes: [640, 750, 828, 1080, 1320, 1920],
    imageSizes: [128, 256, 384],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        hostname: "cdn.shopify.com",
        protocol: "https",
      },
    ],
    unoptimized: !!process.env.V0_CALLBACK_URL,
  },
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        as: "*.css",
        loaders: ["@tailwindcss/turbopack"],
      },
    },
  },
};

export default withShopConfig(nextConfig, [
  shopConfig.botid.isEnabled && withBotId,
  shopConfig.agent.isEnabled && withEve,
]);
