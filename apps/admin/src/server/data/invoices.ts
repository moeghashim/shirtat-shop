import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import type { InvoiceFormValues, InvoiceReferences } from "../../routes/(main)/dashboard/invoice/-components/data.ts";
import { invoiceClients, invoiceDraft, invoiceTaxOptions } from "../db/fixtures/invoices.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({ renderedAt: z.iso.datetime(), draftId: z.string().default("demo") });
type Input = z.input<typeof inputSchema>;
type Result = InvoiceReferences & { defaultValues: InvoiceFormValues | null; renderedAt: string };
type Draft = Omit<InvoiceFormValues, "issuedDate" | "paymentDueDate"> & {
  issuedOffsetDays: number;
  dueOffsetDays: number;
};
function renderDraft(draft: Draft, reference: string): InvoiceFormValues {
  const { issuedOffsetDays, dueOffsetDays, ...values } = draft;
  const issued = new Date(reference);
  issued.setUTCDate(issued.getUTCDate() + issuedOffsetDays);
  const due = new Date(reference);
  due.setUTCDate(due.getUTCDate() + dueOffsetDays);
  return { ...values, issuedDate: issued.toISOString().slice(0, 10), paymentDueDate: due.toISOString().slice(0, 10) };
}
export async function demoInvoices(input: Input): Promise<Result> {
  const { renderedAt, draftId } = inputSchema.parse(input);
  const { id: _id, ...draft } = invoiceDraft;
  return structuredClone({
    renderedAt,
    invoiceClients,
    invoiceTaxOptions,
    defaultValues: draftId === invoiceDraft.id ? renderDraft(draft, renderedAt) : null,
  });
}
export async function dbInvoices(input: Input): Promise<Result> {
  const { renderedAt, draftId } = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const { invoiceParties, invoiceAddresses, invoiceTaxes, invoiceDrafts, invoiceLineItems } = await import(
    "../db/commerce-schema.ts"
  );
  const db = getDatabase();
  const parties = await db.select().from(invoiceParties).orderBy(asc(invoiceParties.position), asc(invoiceParties.id));
  const addresses = await db.select().from(invoiceAddresses).orderBy(asc(invoiceAddresses.position));
  const linesFor = (id: string) => addresses.filter((row) => row.partyId === id).map((row) => row.line);
  const invoiceClients = parties
    .filter((row) => row.kind === "client")
    .map(({ id, name, email, taxId }) => ({ id, name, email, taxId, addressLines: linesFor(id) }));
  const invoiceTaxOptions = (
    await db.select().from(invoiceTaxes).orderBy(asc(invoiceTaxes.position), asc(invoiceTaxes.id))
  ).map(({ position: _position, ...tax }) => ({ ...tax, rate: Number(tax.rate) }));
  const [row] = await db.select().from(invoiceDrafts).where(eq(invoiceDrafts.id, draftId));
  if (!row) return { renderedAt, invoiceClients, invoiceTaxOptions, defaultValues: null };
  const from = parties.find((p) => p.id === row.issuerId && p.kind === "issuer");
  const to = invoiceClients.find((p) => p.id === row.clientId);
  if (!from || !to) throw new Error("Invoice party relationship is invalid.");
  const { id, kind: _kind, position: _position, ...issuer } = from;
  const items = (
    await db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.draftId, draftId))
      .orderBy(asc(invoiceLineItems.position), asc(invoiceLineItems.id))
  ).map(({ position: _order, draftId: _draftId, ...item }) => ({
    ...item,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
  }));
  const { issuerId: _issuerId, clientId: _clientId, id: _id, ...definition } = row;
  return {
    renderedAt,
    invoiceClients,
    invoiceTaxOptions,
    defaultValues: renderDraft(
      {
        ...definition,
        discountValue: Number(definition.discountValue),
        from: { ...issuer, addressLines: linesFor(id) },
        to,
        items,
      },
      renderedAt,
    ),
  };
}
export async function readInvoices(input: Input) {
  return readSource(
    () => demoInvoices(input),
    () => dbInvoices(input),
  );
}
