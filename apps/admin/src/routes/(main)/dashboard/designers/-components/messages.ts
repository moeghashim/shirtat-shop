import type { AdminActionResult } from "../../../../../../../../lib/admin-api/types.ts";

const MESSAGES: Record<string, string> = {
  applied: "Design applied: Shopify drafts created.",
  confirm: "Tick confirm before deleting a designer.",
  created: "Shopify drafts created from the design.",
  deleted: "Designer deleted.",
  failed: "The change did not go through.",
  file: "Design file must be PNG or JPG, up to 4 MB.",
  handle: "Handle must be 2–39 characters: lowercase letters, numbers and hyphens.",
  invalid: "That request was not valid.",
  needhandle: "Assign a handle before approving.",
  notfound: "Designer not found.",
  picks: "Pick at least one product, a category and a title (and a file for new designs).",
  saved: "Saved.",
  shopify: "Shopify request failed. See the error on the design below.",
  taken: "That handle is already used by another designer.",
  "email:sent": "Details email sent (Cloudflare Email Service).",
  "email:queued": "Email could not be sent directly, so it was queued. Copy the link below if needed.",
  "email:not_configured":
    "Email provider not configured yet. A new link was generated; copy it below and send it manually.",
  "email:failed": "Email failed to send. A new link was generated; copy it below.",
};

export function actionMessage(result: AdminActionResult): string {
  const base = MESSAGES[result.code] ?? result.code;
  if (result.code === "created" && result.detail) return `${base} (${result.detail} products)`;
  return result.detail ? `${base} (${result.detail})` : base;
}
