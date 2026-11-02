import type { ShopifyOrderPayload } from "@/lib/catalog/printify";
import { sendOpsEmail } from "@/lib/creators/email";
import { adminGraphql } from "@/lib/creators/shopify-admin";

import { sendCustomOrderEmail } from "./email";
import { checkCustomText } from "./moderation";
import {
  CUSTOM_PROPERTY,
  MUG_REGIONS,
  mugRegionForCountry,
  parseCustomSku,
  printifyTargetForSku,
} from "./products";

export const CUSTOM_PENDING_TAG = "custom:pending";
export const CUSTOM_FLAGGED_TAG = "custom:flagged";

export interface CustomLine {
  country: string | undefined;
  fit: string | undefined;
  index: number;
  note: string[];
  preset: string | undefined;
  quantity: number;
  sku: string;
  style: string | undefined;
  text: string;
  textCheck: ReturnType<typeof checkCustomText>;
  title: string;
}

function esc(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

/** Custom lines on a paid order (SKU CUS-…), with their text, style and a problem list. */
export function extractCustomLines(order: ShopifyOrderPayload): CustomLine[] {
  const country = order.shipping_address?.country_code;
  const lines: CustomLine[] = [];
  for (const line of order.line_items) {
    const parsed = parseCustomSku(line.sku);
    if (!parsed || !line.sku) continue;
    const props = Object.fromEntries((line.properties ?? []).map((p) => [p.name, p.value]));
    const text = String(props[CUSTOM_PROPERTY.text] ?? "").trim();
    const textCheck = checkCustomText(text);
    const note: string[] = [];
    if (!text) note.push("No text on this line.");
    else if (!textCheck.ok)
      note.push(
        `Text check failed (${textCheck.reason}). Do not print without the customer's changed text.`,
      );
    if (!printifyTargetForSku(line.sku)) note.push("No Printify target for this SKU.");
    if (parsed.kind === "mug") {
      const region = mugRegionForCountry(country);
      if (!region)
        note.push(
          `Mugs cannot ship to ${country ?? "this address"}. Refund or ask for a US/EU address.`,
        );
      else if (region !== parsed.region)
        note.push(
          `Customer picked ${MUG_REGIONS[parsed.region].labelEn} but the address is in ${MUG_REGIONS[region].labelEn}. The script will use the ${MUG_REGIONS[region].labelEn} provider.`,
        );
    }
    lines.push({
      country,
      fit: props[CUSTOM_PROPERTY.fit] ?? printifyTargetForSku(line.sku)?.fit ?? undefined,
      index: lines.length + 1,
      note,
      preset: props[CUSTOM_PROPERTY.preset],
      quantity: line.quantity,
      sku: line.sku,
      style: props[CUSTOM_PROPERTY.style],
      text,
      textCheck,
      title: [line.title, line.variant_title].filter(Boolean).join(" / "),
    });
  }
  return lines;
}

/**
 * Custom orders are never sent to Printify automatically: tag them, and email the text, style and
 * product so the design can be made on arabicdesign.ai and attached with scripts/custom-order.mjs.
 */
export async function handleCustomOrder(order: ShopifyOrderPayload): Promise<number> {
  const lines = extractCustomLines(order);
  if (!lines.length) return 0;
  const flagged = lines.some((l) => l.note.length > 0);
  const ownerId = order.admin_graphql_api_id ?? `gid://shopify/Order/${order.id}`;
  const tags = [CUSTOM_PENDING_TAG, ...(flagged ? [CUSTOM_FLAGGED_TAG] : [])];
  await adminGraphql(
    `mutation T($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { message } } }`,
    { id: ownerId, tags },
  ).catch((e) =>
    console.error(`[CUSTOM] ${order.name}: could not tag (Admin app needs write_orders)`, e),
  );

  const adminUrl = `https://admin.shopify.com/store/shirtatco/orders/${order.id}`;
  const text = [
    `Custom order ${order.name}${flagged ? " (NEEDS A LOOK)" : ""}`,
    `Customer: ${order.email ?? "unknown"} · ships to ${lines[0]!.country ?? "?"}`,
    `Shopify: ${adminUrl}`,
    "",
    ...lines.flatMap((l) => [
      `Line ${l.index}: ${l.quantity} × ${l.title}  (SKU ${l.sku})`,
      `  Text:   ${l.text || "(none)"}`,
      ...(l.fit ? [`  Fit:    ${l.fit}`] : []),
      `  Style:  ${l.style ?? "(none)"}${l.preset ? `  · started from example #${l.preset}` : ""}`,
      ...l.note.map((n) => `  ! ${n}`),
      "",
    ]),
    "What to do:",
    "1. Open arabicdesign.ai, make the design with that text and style, export the SVG.",
    `2. Run: pnpm custom-order --order ${order.id} --line 1 --svg <file.svg>   (add --dry-run first to check)`,
    "3. Check the Printify order it created (held). Then add the approve-pod tag to the Shopify order.",
  ].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;max-width:620px;line-height:1.55">
<h2>Custom order ${esc(order.name)}${flagged ? " — needs a look" : ""}</h2>
<p>Customer: ${esc(order.email ?? "unknown")} · ships to <b>${esc(lines[0]!.country ?? "?")}</b><br><a href="${adminUrl}">Open in Shopify</a></p>
${lines
  .map(
    (l) => `<div style="border:1px solid #ddd;border-radius:10px;padding:12px 14px;margin:10px 0">
<b>Line ${l.index}:</b> ${l.quantity} × ${esc(l.title)} <span style="color:#888">(${esc(l.sku)})</span><br>
<span style="color:#666">Text</span> <span dir="auto" style="font-size:22px">${esc(l.text || "(none)")}</span><br>
${l.fit ? `<span style="color:#666">Fit</span> ${esc(l.fit)}<br>` : ""}<span style="color:#666">Style</span> ${esc(l.style ?? "(none)")}${l.preset ? ` · started from example #${esc(l.preset)}` : ""}
${l.note.map((n) => `<div style="color:#b00020">⚠ ${esc(n)}</div>`).join("")}</div>`,
  )
  .join("")}
<ol><li>Make the design on arabicdesign.ai with that text and style and export the SVG.</li>
<li>Run <code>pnpm custom-order --order ${order.id} --line 1 --svg &lt;file.svg&gt;</code> (add <code>--dry-run</code> first).</li>
<li>Check the held Printify order, then add the <code>approve-pod</code> tag to the Shopify order.</li></ol></div>`;
  const sent = await sendCustomOrderEmail({
    html,
    subject: `Custom order ${order.name}: ${lines.length} design${lines.length > 1 ? "s" : ""} to make${flagged ? " (flagged)" : ""}`,
    text,
  });
  console.log(
    `[CUSTOM] ${order.name}: ${lines.length} custom line(s), flagged=${flagged}, email=${sent}`,
  );
  if (sent === "failed")
    await sendOpsEmail({
      html: `<pre>${esc(text)}</pre>`,
      subject: `Custom order ${order.name}`,
      text,
    }).catch(() => undefined);
  return lines.length;
}
