import crypto from "node:crypto";

import { getNumericShopifyId } from "@/lib/shopify/id/server";

const PUBLISH_WINDOW_MS = 2 * 60 * 1000;

export function verifyShopifyWebhook(
  body: string,
  hmacHeader: string | null,
  secret: string,
): boolean {
  if (!hmacHeader) return false;

  const expected = crypto.createHmac("sha256", secret).update(body, "utf8").digest();
  const received = Buffer.from(hmacHeader, "base64");

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export function shopifyWebhookTags(topic: string, payload: unknown): string[] {
  if (topic.startsWith("products/")) return productTags(topic, payload);
  if (topic.startsWith("collections/")) return collectionTags(topic, payload);
  if (topic.startsWith("metaobjects/")) return metaobjectTags(payload);
  return [];
}

function productTags(topic: string, payload: unknown): string[] {
  const tags: string[] = [];
  const record = asRecord(payload);

  if (
    topic === "products/create" ||
    topic === "products/delete" ||
    (topic === "products/update" && justPublished(record))
  ) {
    tags.push("products-index");
  }

  const handle = record ? stringField(record, "handle") : null;
  if (handle) {
    tags.push(`product-${handle}`);
    tags.push(`recommendations-${handle}`);
  }

  const numericId = record ? entityNumericId(record) : null;
  if (numericId) tags.push(`product-${numericId}`);

  return tags;
}

function collectionTags(topic: string, payload: unknown): string[] {
  const tags: string[] = [];
  const record = asRecord(payload);

  if (topic === "collections/create" || topic === "collections/delete") {
    tags.push("collections-index");
  }

  const handle = record ? stringField(record, "handle") : null;
  if (handle) tags.push(`collection-${handle}`);

  const numericId = record ? entityNumericId(record) : null;
  if (numericId) tags.push(`collection-${numericId}`);

  return tags;
}

function metaobjectTags(payload: unknown): string[] {
  // Low-cardinality, so the broad tag refreshes aggregate reads.
  const tags = ["metaobjects"];
  const record = asRecord(payload);
  const handle = record ? stringField(record, "handle") : null;
  if (handle) tags.push(`metaobject-${handle}`);
  return tags;
}

function justPublished(record: Record<string, unknown> | null): boolean {
  if (!record || record.status !== "active") return false;
  const published = Date.parse(stringField(record, "published_at") ?? "");
  const updated = Date.parse(stringField(record, "updated_at") ?? "");
  if (!Number.isFinite(published) || !Number.isFinite(updated)) return false;
  return Math.abs(updated - published) <= PUBLISH_WINDOW_MS;
}

function entityNumericId(record: Record<string, unknown>): string | null {
  const gid = stringField(record, "admin_graphql_api_id");
  if (gid) return getNumericShopifyId(gid);
  return restId(record.id);
}

function restId(id: unknown): string | null {
  if (typeof id === "number" && Number.isInteger(id)) return String(id);
  if (typeof id === "string" && /^\d+$/.test(id)) return id;
  return null;
}

function stringField(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
