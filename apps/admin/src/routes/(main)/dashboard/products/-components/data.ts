export type Category = "Clothing" | "Footwear" | "Accessories" | "Home & living" | "Beauty" | "Electronics";
export type ProductStatus = "Active" | "Draft" | "Archived";

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: Category;
  status: ProductStatus;
  price: number;
  stock: number;
  sold: number;
}

export const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export const number = new Intl.NumberFormat("en-US");

export type CatalogData = { products: Product[]; categories: Category[]; statuses: ProductStatus[] };
