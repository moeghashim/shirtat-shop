import { sendOpsEmail } from "@/lib/creators/email";
/**
 * POD routing. Every product carries (namespace "shirtat"):
 *   pod               list of POD companies, first = primary (Printify, Tapstitch, Prodigi, Inkse, Teepig)
 *   pod_product_id    product id at the primary POD
 *   design_file       URL of the print-ready file (Shopify Files)
 *   production_notes  placement / print size / ink instructions
 * On orders/paid each line is routed by its product's primary POD. Printify lines are placed via the
 * API (PRINTIFY_ENABLED gating); other PODs, or anything Printify can't take, are recorded as
 * "needs manual placement" and emailed to Moe rather than failing the webhook.
 */
import { adminGraphql } from "@/lib/creators/shopify-admin";

import {
  parseSku,
  printifyEnabled,
  sendPrintifyOrderToProduction,
  submitPrintifyOrder,
  type ShopifyOrderPayload,
} from "./printify";

export const POD_COMPANIES = ["Printify", "Tapstitch", "Prodigi", "Inkse", "Teepig"] as const;
export type PodCompany = (typeof POD_COMPANIES)[number];

export const PRODUCTION_NOTES: Record<string, string> = {
  hoodie: "Front centre on chest above pocket, DTG, transparent PNG artwork.",
  print:
    "Full-bleed poster artwork (poster file), matte paper, no borders, no cropping of the calligraphy.",
  sweatshirt: "Front centre on chest, DTG, transparent PNG artwork.",
  "t-shirt":
    "Front centre, DTG print on chest, transparent PNG artwork. Keep original colours; no white underbase on white/light garments.",
  "tote-bag": "Front centre, full print area, transparent PNG artwork.",
};

/** Product metafields that record the POD, for productSet / metafieldsSet. */
export function podMetafields(input: {
  designFileUrl?: string;
  notes?: string;
  pod?: PodCompany[];
  podProductId?: string;
  typeId: string;
}) {
  const m = (key: string, type: string, value: string) => ({
    key,
    namespace: "shirtat",
    type,
    value,
  });
  return [
    m("pod", "list.single_line_text_field", JSON.stringify(input.pod ?? ["Printify"])),
    ...(input.podProductId
      ? [m("pod_product_id", "single_line_text_field", input.podProductId)]
      : []),
    ...(input.designFileUrl ? [m("design_file", "url", input.designFileUrl)] : []),
    m(
      "production_notes",
      "multi_line_text_field",
      input.notes ??
        PRODUCTION_NOTES[input.typeId] ??
        "Front centre, DTG, transparent PNG artwork.",
    ),
  ];
}

interface ProductPod {
  designFile?: string;
  notes?: string;
  pod: string;
  podProductId?: string;
}

async function loadProductPods(productIds: number[]): Promise<Map<number, ProductPod>> {
  const out = new Map<number, ProductPod>();
  if (!productIds.length) return out;
  const data = await adminGraphql<{
    nodes: ({
      designFile: { value: string } | null;
      id: string;
      legacy: { value: string } | null;
      notes: { value: string } | null;
      pod: { value: string } | null;
      podProductId: { value: string } | null;
    } | null)[];
  }>(
    `query Pods($ids: [ID!]!) { nodes(ids: $ids) { ... on Product { id
      pod: metafield(namespace: "shirtat", key: "pod") { value }
      podProductId: metafield(namespace: "shirtat", key: "pod_product_id") { value }
      legacy: metafield(namespace: "shirtat", key: "printify_product_id") { value }
      designFile: metafield(namespace: "shirtat", key: "design_file") { value }
      notes: metafield(namespace: "shirtat", key: "production_notes") { value } } } }`,
    { ids: productIds.map((id) => `gid://shopify/Product/${id}`) },
  );
  for (const n of data.nodes) {
    if (!n?.id) continue;
    let pod = "Printify";
    try {
      pod = (JSON.parse(n.pod?.value ?? "[]") as string[])[0] ?? (n.legacy ? "Printify" : "");
    } catch {}
    out.set(Number(n.id.split("/").pop()), {
      designFile: n.designFile?.value,
      notes: n.notes?.value,
      pod,
      podProductId: n.podProductId?.value ?? n.legacy?.value,
    });
  }
  return out;
}

export interface PodOrderRecord {
  error?: string;
  lines: {
    designFile?: string;
    notes?: string;
    quantity: number;
    sku: string | null;
    title: string;
  }[];
  pod: string;
  podOrderId?: string;
  /** Printify status after the send-to-production step, e.g. "sending-to-production". */
  productionStatus?: string;
  status: "placed" | "placed_on_hold" | "needs_manual_placement" | "failed";
}

function esc(s: string) {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );
}

/** Routes a paid order's lines to their PODs, records the result on the order and emails manual work. */
export async function routeOrderToPods(order: ShopifyOrderPayload): Promise<PodOrderRecord[]> {
  const ids = [
    ...new Set(order.line_items.map((l) => l.product_id).filter((x): x is number => Boolean(x))),
  ];
  const pods = await loadProductPods(ids);
  const groups = new Map<
    string,
    { info?: ProductPod; line: ShopifyOrderPayload["line_items"][number] }[]
  >();
  for (const line of order.line_items) {
    const info = line.product_id ? pods.get(line.product_id) : undefined;
    const pod = info?.pod || (parseSku(line.sku) ? "Printify" : "");
    if (!pod) continue; // not a POD product
    groups.set(pod, [...(groups.get(pod) ?? []), { info, line }]);
  }

  const records: PodOrderRecord[] = [];
  for (const [pod, items] of groups) {
    const lines = items.map(({ info, line }) => ({
      designFile: info?.designFile,
      notes: info?.notes,
      quantity: line.quantity,
      sku: line.sku,
      title: [line.title, line.variant_title].filter(Boolean).join(" / "),
    }));
    const rec: PodOrderRecord = { lines, pod, status: "needs_manual_placement" };
    if (pod === "Printify") {
      const pfLines = items.flatMap(({ info, line }) => {
        const p = parseSku(line.sku);
        return p
          ? [
              {
                productId: info?.podProductId ?? p.productId,
                quantity: line.quantity,
                variantId: p.variantId,
              },
            ]
          : [];
      });
      if (!printifyEnabled()) rec.error = "Printify is disabled (PRINTIFY_ENABLED / token)";
      else if (pfLines.length !== items.length)
        rec.error = "Some lines have no Printify variant SKU";
      else {
        try {
          const id = await submitPrintifyOrder(order, pfLines);
          if (!id) rec.error = "No shipping address";
          else {
            rec.podOrderId = id;
            try {
              rec.productionStatus = await sendPrintifyOrderToProduction(id);
              rec.status = "placed";
            } catch (e) {
              rec.status = "placed_on_hold";
              rec.error = `Printify order ${id} created but send to production failed: ${e instanceof Error ? e.message : String(e)}`;
              console.error(`[POD] ${order.name}: send to production failed`, rec.error);
            }
          }
        } catch (e) {
          rec.error = e instanceof Error ? e.message : "Printify order failed";
        }
      }
    } else {
      rec.error = `${pod} has no API integration yet`;
    }
    records.push(rec);
  }
  if (!records.length) return records;

  await recordOnOrder(order, records).catch((e) =>
    console.error("[POD] could not record on order", e),
  );
  const manual = records.filter((r) => r.status !== "placed");
  if (manual.length) {
    console.warn(`[POD] ${order.name}: manual placement needed`, JSON.stringify(manual));
    const text = manual
      .map(
        (r) =>
          `${r.pod}: ${r.error ?? ""}\n${r.lines.map((l) => `- ${l.quantity} × ${l.title} (SKU ${l.sku ?? "none"})\n  Design: ${l.designFile ?? "n/a"}\n  Notes: ${l.notes ?? "n/a"}`).join("\n")}`,
      )
      .join("\n\n");
    await sendOpsEmail({
      html: `<h2>Order ${esc(order.name)} needs manual POD placement</h2><pre style="white-space:pre-wrap">${esc(text)}</pre>`,
      subject: `Shirtat ${order.name}: place with ${manual.map((r) => r.pod).join(", ")}`,
      text: `Order ${order.name} needs manual POD placement.\n\n${text}`,
    }).catch((e) => console.error("[POD] ops email failed", e));
  }
  return records;
}

async function recordOnOrder(order: ShopifyOrderPayload, records: PodOrderRecord[]) {
  const ownerId = order.admin_graphql_api_id ?? `gid://shopify/Order/${order.id}`;
  const tags = records.map(
    (r) =>
      `pod:${r.pod.toLowerCase()}:${r.podOrderId ?? r.status}${r.status === "placed_on_hold" ? ":on-hold" : ""}`,
  );
  await adminGraphql(
    `mutation Rec($m: [MetafieldsSetInput!]!, $id: ID!, $tags: [String!]!) {
      metafieldsSet(metafields: $m) { userErrors { message } }
      tagsAdd(id: $id, tags: $tags) { userErrors { message } } }`,
    {
      id: ownerId,
      m: [
        {
          key: "pod_orders",
          namespace: "shirtat",
          ownerId,
          type: "json",
          value: JSON.stringify(records),
        },
      ],
      tags,
    },
  );
}
