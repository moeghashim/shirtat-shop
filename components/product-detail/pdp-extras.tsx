import { ChevronDownIcon, GlobeIcon, PrinterIcon, RotateCcwIcon } from "lucide-react";

import { ProductCard } from "@/components/product-card/product-card";
import { Link } from "@/components/ui/link";
import type { CommerceLocale } from "@/lib/config/types";
import { getAlsoLike, getMoreFromDesign, getPdpExtras } from "@/lib/product/pdp-extras";
import { type Bilingual, getProductSpecs } from "@/lib/product/specs";

type Copy = Record<string, { en: string; ar: string }>;
const C: Copy = {
  story: { en: "The design", ar: "عن التصميم" },
  meaning: { en: "Meaning", ar: "المعنى" },
  origin: { en: "Origin", ar: "الأصل" },
  printed: { en: "Printed on demand", ar: "طباعة عند الطلب" },
  ships: { en: "Ships worldwide", ar: "شحن لكل العالم" },
  returns: { en: "Easy returns", ar: "إرجاع سهل" },
  designer: { en: "Designed by", ar: "تصميم" },
  sizeGuide: { en: "Size guide", ar: "دليل المقاسات" },
  fabric: { en: "Fabric & care", ar: "القماش والعناية" },
  shipping: { en: "Shipping", ar: "الشحن" },
  details: { en: "Details", ar: "التفاصيل" },
  printing: { en: "Printing", ar: "الطباعة" },
  unknown: { en: "Unknown (not published by the vendor)", ar: "غير معروف (لم ينشره المورّد)" },
  more: { en: "More from this design", ar: "المزيد من هذا التصميم" },
  alsoLike: { en: "You might also like", ar: "قد يعجبك أيضاً" },
  outOfStock: { en: "Out of Stock", ar: "نفد المخزون" },
};
const t = (k: string, ar: boolean) => (ar ? C[k]!.ar : C[k]!.en);

function productKind(
  handle: string,
): "tee" | "hoodie" | "sweatshirt" | "cap" | "beanie" | "tote" | "print" | "other" {
  if (handle.endsWith("-t-shirt")) return "tee";
  if (handle.endsWith("-hoodie")) return "hoodie";
  if (handle.endsWith("-sweatshirt")) return "sweatshirt";
  if (handle.endsWith("-cap")) return "cap";
  if (handle.endsWith("-beanie")) return "beanie";
  if (handle.endsWith("-tote-bag")) return "tote";
  if (handle.endsWith("-print")) return "print";
  return "other";
}

const SIZE_ROWS: Record<string, Array<[string, string, string]>> = {
  // [size, chest width cm, length cm]
  tee: [
    ["S", "46", "71"],
    ["M", "51", "74"],
    ["L", "56", "76"],
    ["XL", "61", "79"],
    ["2XL", "66", "81"],
  ],
  hoodie: [
    ["S", "51", "69"],
    ["M", "56", "71"],
    ["L", "61", "74"],
    ["XL", "66", "76"],
    ["2XL", "71", "79"],
  ],
  sweatshirt: [
    ["S", "51", "69"],
    ["M", "56", "71"],
    ["L", "61", "74"],
    ["XL", "66", "76"],
    ["2XL", "71", "79"],
  ],
};

function fabricCopy(kind: ReturnType<typeof productKind>, ar: boolean): string {
  const en: Record<string, string> = {
    tee: "Soft ringspun cotton tee with a classic unisex fit. Machine wash cold inside out, tumble dry low, do not iron on the print.",
    hoodie:
      "Cotton-poly fleece hoodie with a front pouch pocket. Machine wash cold inside out, tumble dry low, do not iron on the print.",
    sweatshirt:
      "Cotton-poly fleece crewneck with ribbed cuffs. Machine wash cold inside out, tumble dry low, do not iron on the print.",
    cap: "Cotton twill dad cap with embroidered design and an adjustable strap. Spot clean only.",
    beanie: "Soft acrylic knit beanie with an embroidered cuff. Hand wash cold, lay flat to dry.",
    tote: "Sturdy cotton tote with long handles. Machine wash cold, line dry.",
    print: "Museum-quality matte poster paper. Frame not included. Keep out of direct sunlight.",
    other: "Printed on demand to high-quality standards.",
  };
  const arCopy: Record<string, string> = {
    tee: "تيشيرت قطني ناعم بقصة كلاسيكية للجنسين. يُغسل بماء بارد مقلوباً، ويُجفف على حرارة منخفضة، ولا يُكوى فوق الطباعة.",
    hoodie:
      "هودي من مزيج القطن والبوليستر مع جيب أمامي. يُغسل بماء بارد مقلوباً، ويُجفف على حرارة منخفضة، ولا يُكوى فوق الطباعة.",
    sweatshirt:
      "سويتشيرت بياقة دائرية وأساور مضلعة. يُغسل بماء بارد مقلوباً، ويُجفف على حرارة منخفضة، ولا يُكوى فوق الطباعة.",
    cap: "قبعة قطنية مطرزة بحزام قابل للتعديل. تُنظف موضعياً فقط.",
    beanie: "قبعة صوفية محبوكة بتطريز على الحافة. تُغسل يدوياً بماء بارد وتُجفف مسطحة.",
    tote: "حقيبة قطنية متينة بمقابض طويلة. تُغسل بماء بارد وتُجفف بالهواء.",
    print: "ورق ملصقات مطفي عالي الجودة. الإطار غير مشمول. يُحفظ بعيداً عن الشمس المباشرة.",
    other: "يُطبع عند الطلب بجودة عالية.",
  };
  return (ar ? arCopy : en)[kind]!;
}

export async function DesignStoryBlock({
  handle,
  isArabic,
}: {
  handle: string;
  isArabic: boolean;
}) {
  const { story } = await getPdpExtras(handle, isArabic);
  if (!story?.phrase) return null;
  return (
    <section
      data-slot="design-story"
      className="grid gap-1.5 border-t border-border pt-5"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {t("story", isArabic)}
      </h2>
      <p
        dir="rtl"
        lang="ar"
        className={`font-arabic text-4xl leading-tight font-semibold ${isArabic ? "text-right" : "text-left"}`}
      >
        {story.phrase}
      </p>
      {story.meaning ? (
        <p className="text-sm">
          <span className="font-medium">{t("meaning", isArabic)}: </span>
          {story.meaning}
        </p>
      ) : null}
      {story.origin ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{t("origin", isArabic)}: </span>
          {story.origin}
        </p>
      ) : null}
    </section>
  );
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-border">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDownIcon
          aria-hidden
          className="size-4 shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="pb-4 text-sm text-muted-foreground">{children}</div>
    </details>
  );
}

export function PdpTrustAndDetails({
  handle,
  isArabic,
  specsSlot,
  storySlot,
}: {
  handle: string;
  isArabic: boolean;
  specsSlot?: React.ReactNode;
  storySlot?: React.ReactNode;
}) {
  const kind = productKind(handle);
  const rows = SIZE_ROWS[kind];
  const trust = [
    { icon: PrinterIcon, label: t("printed", isArabic), href: undefined },
    { icon: GlobeIcon, label: t("ships", isArabic), href: "/shipping" },
    { icon: RotateCcwIcon, label: t("returns", isArabic), href: "/refunds" },
  ];
  return (
    <div className="grid gap-5" dir={isArabic ? "rtl" : "ltr"}>
      <ul className="grid grid-cols-3 gap-2">
        {trust.map(({ icon: Icon, label, href }) => {
          const inner = (
            <>
              <Icon aria-hidden className="size-5" />
              <span className="text-center text-xs leading-tight">{label}</span>
            </>
          );
          const cls =
            "flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-lg border border-border px-1 py-2";
          return (
            <li key={label}>
              {href ? (
                <Link href={href} className={`${cls} hover:bg-muted`}>
                  {inner}
                </Link>
              ) : (
                <div className={cls}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-sm">
        {t("designer", isArabic)}{" "}
        <Link
          href="/designers/shirtat"
          className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
        >
          Shirtat
        </Link>
      </p>
      {storySlot}
      <div className="border-t border-border">
        {specsSlot ?? <LegacySizeAndFabric kind={kind} rows={rows} isArabic={isArabic} />}
        <Accordion title={t("shipping", isArabic)}>
          <p>
            {isArabic
              ? "كل قطعة تُطبع خصيصاً لك بعد الطلب، ثم تُشحن إلى كل دولة يغطيها شركاؤنا في الطباعة عند الطلب."
              : "Each piece is printed just for you after you order, then shipped to every country our print-on-demand partners cover."}{" "}
            <Link
              href="/shipping"
              className="font-medium text-foreground underline underline-offset-4"
            >
              {isArabic ? "تفاصيل الشحن" : "Shipping details"}
            </Link>
          </p>
        </Accordion>
      </div>
    </div>
  );
}

function Row({
  title,
  products,
  isArabic,
}: {
  title: string;
  products: Awaited<ReturnType<typeof getMoreFromDesign>>;
  isArabic: boolean;
}) {
  if (products.length === 0) return null;
  return (
    <section className="grid min-w-0 gap-4" dir={isArabic ? "rtl" : "ltr"}>
      <h2 className="text-2xl sm:text-3xl">{title}</h2>
      <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {products.map((product) => (
          <div key={product.id} className="w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-auto">
            <ProductCard product={product} outOfStockText={t("outOfStock", isArabic)} />
          </div>
        ))}
      </div>
    </section>
  );
}

export async function MoreFromDesignRow({
  handle,
  isArabic,
  locale,
}: {
  handle: string;
  isArabic: boolean;
  locale: CommerceLocale;
}) {
  const products = await getMoreFromDesign(handle, locale);
  return <Row title={t("more", isArabic)} products={products} isArabic={isArabic} />;
}

export async function AlsoLikeRow({
  handle,
  isArabic,
  locale,
}: {
  handle: string;
  isArabic: boolean;
  locale: CommerceLocale;
}) {
  const { category } = await getPdpExtras(handle, isArabic);
  let products = category ? await getAlsoLike(handle, category, locale) : [];
  if (products.length < 2 && category !== "cultures") {
    products = await getAlsoLike(handle, "cultures", locale);
  }
  return <Row title={t("alsoLike", isArabic)} products={products} isArabic={isArabic} />;
}

function LegacySizeAndFabric({
  kind,
  rows,
  isArabic,
}: {
  kind: ReturnType<typeof productKind>;
  rows: Array<[string, string, string]> | undefined;
  isArabic: boolean;
}) {
  return (
    <>
      {rows ? (
        <Accordion title={t("sizeGuide", isArabic)}>
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead>
                <tr className="text-foreground">
                  <th className="py-1 text-start font-medium">{isArabic ? "المقاس" : "Size"}</th>
                  <th className="py-1 text-start font-medium">
                    {isArabic ? "عرض الصدر (سم)" : "Chest width (cm)"}
                  </th>
                  <th className="py-1 text-start font-medium">
                    {isArabic ? "الطول (سم)" : "Length (cm)"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([s, w, l]) => (
                  <tr key={s} className="border-t border-border">
                    <td className="py-1">{s}</td>
                    <td className="py-1">{w}</td>
                    <td className="py-1">{l}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2">
            {isArabic
              ? "القياسات تقريبية وقد تختلف بمقدار 2–3 سم. القصة للجنسين."
              : "Measurements are approximate and may vary by 2–3 cm. Unisex fit."}
          </p>
        </Accordion>
      ) : null}
      <Accordion title={t("fabric", isArabic)}>{fabricCopy(kind, isArabic)}</Accordion>
    </>
  );
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(7rem,35%)_1fr] gap-3 border-t border-border py-1.5 first:border-t-0">
      <dt className="font-medium text-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** Details + Printing accordions from shirtat.specs / shirtat.print_method (vendor data). */
export async function ProductSpecsBlock({
  handle,
  isArabic,
}: {
  handle: string;
  isArabic: boolean;
}) {
  const { specs, print } = await getProductSpecs(handle);
  if (!specs && !print) {
    const kind = productKind(handle);
    return <LegacySizeAndFabric kind={kind} rows={SIZE_ROWS[kind]} isArabic={isArabic} />;
  }
  const unknown = t("unknown", isArabic);
  const b = (v: Bilingual | null | undefined) => (v ? (isArabic ? v.ar : v.en) : unknown);
  const L = isArabic
    ? {
        blank: "القطعة الأساسية",
        vendor: "مورّد الطباعة",
        fabric: "القماش",
        weight: "الوزن",
        fit: "القصة",
        sizes: "المقاسات",
        care: "العناية",
        origin: "المنشأ",
        chart: "جدول المقاسات (سم)",
        size: "المقاس",
        method: "طريقة الطباعة",
        placement: "موضع الطباعة",
        area: "مساحة الطباعة",
        options: "خيارات المورّد",
        source: "المصدر: بيانات المورّد",
      }
    : {
        blank: "Blank",
        vendor: "Print partner",
        fabric: "Fabric",
        weight: "Weight",
        fit: "Fit",
        sizes: "Sizes",
        care: "Care",
        origin: "Origin",
        chart: "Size chart (cm)",
        size: "Size",
        method: "Method",
        placement: "Placement",
        area: "Print area",
        options: "Vendor options",
        source: "Source: vendor data",
      };
  return (
    <>
      {specs ? (
        <Accordion title={t("details", isArabic)}>
          <dl className="grid">
            <SpecRow
              label={L.blank}
              value={isArabic && specs.blankAr ? specs.blankAr : specs.blank}
            />
            <SpecRow
              label={L.vendor}
              value={
                specs.provider === specs.vendor
                  ? specs.vendor
                  : `${specs.vendor} · ${specs.provider}`
              }
            />
            <SpecRow label={L.fabric} value={b(specs.fabric)} />
            <SpecRow label={L.weight} value={<span dir="ltr">{specs.weight ?? unknown}</span>} />
            <SpecRow label={L.fit} value={b(specs.fit)} />
            <SpecRow label={L.sizes} value={<span dir="ltr">{specs.sizes.join(" · ")}</span>} />
            <SpecRow label={L.care} value={b(specs.care)} />
            <SpecRow label={L.origin} value={b(specs.origin)} />
          </dl>
          <p className="mt-3 font-medium text-foreground">{L.chart}</p>
          {specs.sizeChart ? (
            <div className="overflow-x-auto">
              <table className="w-full text-start">
                <thead>
                  <tr className="text-foreground">
                    <th className="py-1 text-start font-medium">{L.size}</th>
                    {specs.sizeChart.columns.map((c) => (
                      <th key={c.en} className="py-1 text-start font-medium">
                        {isArabic ? c.ar : c.en}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {specs.sizeChart.sizes.map((s, i) => (
                    <tr key={s} className="border-t border-border">
                      <td className="py-1">{s}</td>
                      {specs.sizeChart!.columns.map((c) => (
                        <td key={c.en} className="py-1">
                          {c.values[i]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>{unknown}</p>
          )}
          <p className="mt-2 text-xs">
            <a
              href={specs.source}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              {L.source}
            </a>
          </p>
        </Accordion>
      ) : null}
      {print ? (
        <Accordion title={t("printing", isArabic)}>
          <dl className="grid">
            <SpecRow label={L.method} value={b(print.method)} />
            <SpecRow label={L.placement} value={b(print.placement)} />
            <SpecRow label={L.area} value={<span dir="ltr">{print.printArea ?? unknown}</span>} />
            <SpecRow
              label={L.options}
              value={
                <ul className="grid gap-0.5">
                  {print.available.map((o) => (
                    <li key={o.method}>
                      <span className="font-medium text-foreground">{o.method}</span>
                      {o.areas.length
                        ? `: ${o.areas.map((a) => (isArabic ? a.ar : a.en)).join(isArabic ? "، " : ", ")}`
                        : ""}
                    </li>
                  ))}
                </ul>
              }
            />
          </dl>
        </Accordion>
      ) : null}
    </>
  );
}
