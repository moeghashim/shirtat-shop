"use client";

import { useT } from "@/lib/i18n/client";

export function AgentThinking({ active, tool }: { active: boolean; tool?: string }) {
  const t = useT();
  if (!active) return null;
  const toolLabels: Record<string, string> = {
    "add-cart-note": "Adding your note…",
    "add-to-cart": "Adding to cart…",
    "browse-collection": "Browsing the collection…",
    "change-cart-item-options": "Updating your cart…",
    "get-cart": "Checking your cart…",
    "get-product-details": "Looking up product details…",
    "get-recommendations": "Finding recommendations…",
    "list-collections": "Looking at collections…",
    navigate: "Finding the page…",
    "present-products": "Preparing product cards…",
    policies__search_shop_policies_and_faqs: "Checking store policies…",
    shopify__search_catalog: "Searching products…",
    "update-cart-item": "Updating your cart…",
    "update-discount-code": "Updating your discount codes…",
    "escalate-to-human": "Passing this to the team…",
    "get-sizing": "Checking the size chart…",
    "get-store-policies": "Checking store policies…",
    "lookup-order": "Looking up your order…",
  };
  return (
    <p className="shimmer w-fit text-muted-foreground text-sm" role="status">
      {tool && Object.hasOwn(toolLabels, tool) ? t(toolLabels[tool]) : t("Thinking…")}
    </p>
  );
}
