import { isCustomDesignHandle } from "@/lib/custom/products";

import type { Guide, GuideProduct, ProductRail, RailProduct } from "./types";

const BANDS = [
  {
    heading: { ar: "أقل من 35 دولارًا", en: "Under $35" },
    max: 35,
    min: 0,
  },
  {
    heading: { ar: "من 35 إلى 60 دولارًا", en: "$35 to $60" },
    max: 60,
    min: 35,
  },
  {
    heading: { ar: "60 دولارًا فأكثر", en: "$60 and over" },
    max: Number.POSITIVE_INFINITY,
    min: 60,
  },
] as const;

function haystack(product: { description?: string; handle: string; title: string }): string {
  return `${product.title}\n${product.handle}\n${product.description ?? ""}`.toLowerCase();
}

export function textCarries(
  product: { description?: string; handle: string; title: string },
  needles: readonly string[],
): boolean {
  const text = haystack(product);
  return needles.some((needle) => text.includes(needle.toLowerCase()));
}

function sellable(product: GuideProduct): boolean {
  return !isCustomDesignHandle(product.handle) && !product.tags.includes("example");
}

function matchesType(
  product: GuideProduct,
  productType: "baby" | "hoodie" | "kids" | "tee",
): boolean {
  if (!sellable(product)) return false;
  const type = product.productType;
  if (productType === "baby") return /baby/i.test(type);
  if (productType === "kids") return /kid/i.test(type);
  if (productType === "hoodie") return /hoodie/i.test(type) && !/kid|baby/i.test(type);
  return /^t-?shirts?$/i.test(type);
}

function byPrice(products: RailProduct[]): RailProduct[] {
  return [...products].sort(
    (a, b) => Number(a.price.amount) - Number(b.price.amount) || a.title.localeCompare(b.title),
  );
}

function take(products: RailProduct[], limit: number): RailProduct[] {
  return byPrice(products).slice(0, limit);
}

function priceBands(products: GuideProduct[]): ProductRail[] | undefined {
  const priced = products.filter(sellable);
  if (priced.length === 0) return [];
  if (priced.some((product) => product.price.currencyCode !== "USD")) return undefined;
  return BANDS.map((band) => ({
    heading: band.heading,
    products: take(
      priced.filter((product) => {
        const amount = Number(product.price.amount);
        return amount >= band.min && amount < band.max;
      }),
      6,
    ),
  })).filter((band) => band.products.length > 0);
}

const TYPE_HEADING = {
  baby: { ar: "للرضّع", en: "For a baby" },
  hoodie: { ar: "هوديز في المتجر", en: "Hoodies in the shop" },
  kids: { ar: "للأطفال", en: "For kids" },
  tee: { ar: "تيشيرتات للجنسين", en: "Unisex t-shirts" },
} as const;

const SHOP_HEADING = { ar: "في المتجر", en: "In the shop" };

const CATALOG_NOTE = {
  ar: "لم يُحمَّل الكتالوج، فهذه الصفحة لا تسرد المنتجات المباشرة. الروابط أدناه ما زالت تفتح المتجر.",
  en: "The catalog did not load, so this page is not listing live products. The links below still open the shop.",
};

export function guideRails(
  guide: Guide,
  catalog: { ok: boolean; products: GuideProduct[] },
  occasions: { ok: boolean; products: RailProduct[] },
): ProductRail[] {
  const { match } = guide;
  if (match.kind === "none") return [];
  if (!catalog.ok && match.kind !== "occasions") {
    return [{ heading: SHOP_HEADING, note: CATALOG_NOTE, products: [] }];
  }

  if (match.kind === "needles" || match.kind === "all") {
    const products = take(
      catalog.products.filter((product) =>
        match.kind === "needles"
          ? textCarries(product, match.needles)
          : match.groups.every((group) => textCarries(product, group)),
      ),
      8,
    );
    return products.length ? [{ heading: SHOP_HEADING, products }] : [];
  }

  if (match.kind === "type") {
    const products = take(
      catalog.products.filter((product) => matchesType(product, match.productType)),
      8,
    );
    return products.length ? [{ heading: TYPE_HEADING[match.productType], products }] : [];
  }

  if (match.kind === "occasions") {
    if (!occasions.ok) {
      return [
        {
          heading: { ar: "مجموعة المناسبات", en: "Occasions collection" },
          note: {
            ar: "تعذّر تحميل مجموعة المناسبات، فلا نعرف إن كانت تضم قطعًا الآن.",
            en: "The occasions collection did not load, so this page cannot say whether it has pieces right now.",
          },
          products: [],
        },
      ];
    }
    return occasions.products.length
      ? [
          {
            heading: { ar: "مجموعة المناسبات", en: "Occasions collection" },
            products: occasions.products.slice(0, 8),
          },
        ]
      : [];
  }

  const bands = priceBands(catalog.products);
  const emptyType = {
    baby: {
      ar: "لا قطعة رضّع في الكتالوج الآن.",
      en: "No baby product is in the catalog right now.",
    },
    kids: {
      ar: "لا قطعة أطفال في الكتالوج الآن.",
      en: "No kids' product is in the catalog right now.",
    },
    tee: {
      ar: "لا تيشيرت للجنسين في الكتالوج الآن.",
      en: "No unisex t-shirt is in the catalog right now.",
    },
  } as const;
  const rails: ProductRail[] = (["tee", "kids", "baby"] as const).map((productType) => {
    const products = take(
      catalog.products.filter((product) => matchesType(product, productType)),
      8,
    );
    return products.length
      ? { heading: TYPE_HEADING[productType], products }
      : { heading: TYPE_HEADING[productType], note: emptyType[productType], products };
  });
  if (!bands) {
    rails.push({
      heading: { ar: "حسب السعر", en: "By price" },
      note: {
        ar: "أسعار الكتالوج ليست كلها بالدولار الأمريكي، فهذه الصفحة لا تقسّمها إلى شرائح.",
        en: "The catalog is not priced in one US dollar list, so this page does not split it into dollar bands.",
      },
      products: [],
    });
  } else {
    rails.push(...bands);
  }
  return rails;
}
