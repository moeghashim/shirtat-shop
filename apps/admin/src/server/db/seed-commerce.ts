import type { getDatabase } from "./client.server.ts";
import {
  catalogProducts,
  invoiceAddresses,
  invoiceDrafts,
  invoiceLineItems,
  invoiceParties,
  invoiceTaxes,
  productCategories,
  productStatuses,
} from "./commerce-schema.ts";
import { invoiceClients, invoiceDraft, invoiceTaxOptions } from "./fixtures/invoices.ts";
import { categories, products, statuses } from "./fixtures/products.ts";

type Transaction = Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0];
export async function seedCommerce(tx: Transaction) {
  for (const [position, name] of categories.entries())
    await tx
      .insert(productCategories)
      .values({ name, position })
      .onConflictDoUpdate({ target: productCategories.name, set: { position } });
  for (const [position, name] of statuses.entries())
    await tx
      .insert(productStatuses)
      .values({ name, position })
      .onConflictDoUpdate({ target: productStatuses.name, set: { position } });
  for (const [position, product] of products.entries()) {
    const row = { ...product, position, price: product.price.toFixed(2) };
    await tx.insert(catalogProducts).values(row).onConflictDoUpdate({ target: catalogProducts.id, set: row });
  }
  const issuerId = "northwind-studio";
  const { addressLines, ...issuer } = invoiceDraft.from;
  const issuerRow = { ...issuer, id: issuerId, position: 0, kind: "issuer" as const };
  await tx.insert(invoiceParties).values(issuerRow).onConflictDoUpdate({ target: invoiceParties.id, set: issuerRow });
  for (const [position, client] of invoiceClients.entries()) {
    const { addressLines: _addresses, ...party } = client;
    const row = { ...party, position, kind: "client" as const };
    await tx.insert(invoiceParties).values(row).onConflictDoUpdate({ target: invoiceParties.id, set: row });
  }
  for (const party of [{ id: issuerId, addressLines }, ...invoiceClients]) {
    for (const [position, line] of party.addressLines.entries()) {
      const row = { partyId: party.id, position, line };
      await tx
        .insert(invoiceAddresses)
        .values(row)
        .onConflictDoUpdate({ target: [invoiceAddresses.partyId, invoiceAddresses.position], set: row });
    }
  }
  for (const [position, tax] of invoiceTaxOptions.entries()) {
    const row = { ...tax, position, rate: String(tax.rate) };
    await tx.insert(invoiceTaxes).values(row).onConflictDoUpdate({ target: invoiceTaxes.id, set: row });
  }
  const { from: _from, to, items, ...draft } = invoiceDraft;
  const row = { ...draft, issuerId, clientId: to.id, discountValue: String(draft.discountValue) };
  await tx.insert(invoiceDrafts).values(row).onConflictDoUpdate({ target: invoiceDrafts.id, set: row });
  for (const [position, item] of items.entries()) {
    const line = {
      ...item,
      position,
      draftId: draft.id,
      quantity: String(item.quantity),
      unitPrice: item.unitPrice.toFixed(2),
    };
    await tx
      .insert(invoiceLineItems)
      .values(line)
      .onConflictDoUpdate({ target: [invoiceLineItems.draftId, invoiceLineItems.id], set: line });
  }
}
