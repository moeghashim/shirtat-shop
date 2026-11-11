import type { InvoiceTaxOption, InvoiceToDetails } from "../../../routes/(main)/dashboard/invoice/-components/data.ts";

const defaultClient: InvoiceToDetails = {
  id: "aiy-cap",
  name: "Cedar Works",
  email: "billing@cedar.example.com",
  addressLines: ["One BKC, Bandra Kurla Complex", "Mumbai, Maharashtra 400051"],
  taxId: "GSTIN-27AAICA9102K1Z7",
};

// Draft defaults use the request's UTC civil date. Edited dates stay literal YYYY-MM-DD values.
export const invoiceDraft = {
  id: "demo",
  issuedOffsetDays: 0,
  dueOffsetDays: 14,
  referenceNumber: "FL-0425",
  from: {
    name: "Northwind Studio",
    email: "hello@northwind.example.com",
    phone: "+1-512-555-0184",
    website: "northwind.example.com",
    addressLines: ["214 Pixel Avenue", "Austin, TX 78701"],
    taxId: "NW-1029384756",
    paymentAccountName: "Mercury Business",
    routingNumber: "084009519",
    issuerName: "Jordan Lee",
  },
  to: defaultClient,
  taxId: "vat",
  discountType: "fixed" as const,
  discountValue: 40,
  items: [
    {
      id: "hosting",
      description: "Cloud hosting services",
      quantity: 1,
      unitPrice: 3500,
    },
    {
      id: "analytics",
      description: "Data analytics report",
      quantity: 2,
      unitPrice: 750,
    },
    {
      id: "support",
      description: "Technical support retainer",
      quantity: 1,
      unitPrice: 400,
    },
  ],
};

export const invoiceTaxOptions: InvoiceTaxOption[] = [
  {
    id: "gst",
    name: "GST",
    rate: 18,
  },
  {
    id: "vat",
    name: "VAT",
    rate: 12,
  },
  {
    id: "service-tax",
    name: "Service Tax",
    rate: 10,
  },
  {
    id: "none",
    name: "No Tax",
    rate: 0,
  },
];

export const invoiceClients: InvoiceToDetails[] = [
  {
    id: "bright-enterprises",
    name: "Bright Enterprises",
    email: "billing@bright.example.com",
    addressLines: ["450 Park Avenue South", "New York, NY 10016", "United States"],
    taxId: "US-EIN-84-2938475",
  },
  defaultClient,
  {
    id: "northline-gmbh",
    name: "Northline GmbH",
    email: "ap@northline.example.com",
    addressLines: ["Kastanienallee 32", "10435 Berlin", "Germany"],
    taxId: "DE-VAT-219384756",
  },
];
