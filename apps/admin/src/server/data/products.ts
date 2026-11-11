import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import type { CatalogData, Category, ProductStatus } from "../../routes/(main)/dashboard/products/-components/data.ts";
import { categories, products, statuses } from "../db/fixtures/products.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({ id: z.string().optional(), category: z.string().optional() });
type Input = z.infer<typeof inputSchema>;
export async function demoProducts(input: Input = {}): Promise<CatalogData> {
  const { id, category } = inputSchema.parse(input);
  return structuredClone({
    products: products.filter(
      (p) => (id === undefined || p.id === id) && (category === undefined || p.category === category),
    ),
    categories: [...categories],
    statuses: [...statuses],
  });
}
export async function dbProducts(input: Input = {}): Promise<CatalogData> {
  const { id, category } = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const { catalogProducts: table, productCategories, productStatuses } = await import("../db/commerce-schema.ts");
  const db = getDatabase();
  const rows = await db
    .select()
    .from(table)
    .where(
      and(
        id === undefined ? undefined : eq(table.id, id),
        category === undefined ? undefined : eq(table.category, category),
      ),
    )
    .orderBy(asc(table.position), asc(table.id));
  const categoryRows = await db
    .select()
    .from(productCategories)
    .orderBy(asc(productCategories.position), asc(productCategories.name));
  const statusRows = await db
    .select()
    .from(productStatuses)
    .orderBy(asc(productStatuses.position), asc(productStatuses.name));
  return {
    products: rows.map(({ position: _position, ...row }) => ({
      ...row,
      category: row.category as Category,
      status: row.status as ProductStatus,
      price: Number(row.price),
    })),
    categories: categoryRows.map((row) => row.name as Category),
    statuses: statusRows.map((row) => row.name as ProductStatus),
  };
}
export async function readProducts(input: Input = {}) {
  return readSource(
    () => demoProducts(input),
    () => dbProducts(input),
  );
}
