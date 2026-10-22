import { ChevronDownIcon, GlobeIcon, PrinterIcon, RotateCcwIcon } from "lucide-react";

import { ProductCard } from "@/components/product-card/product-card";
import { Link } from "@/components/ui/link";
import type { CommerceLocale } from "@/lib/config/types";
import { getAlsoLike, getMoreFromDesign, getPdpExtras } from "@/lib/product/pdp-extras";

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
  more: { en: "More from this design", ar: "المزيد من هذا التصميم" },
  alsoLike: { en: "You might also like", ar: "قد يعجبك أيضاً" },
  outOfStock: { en: "Out of Stock", ar: "نفد المخزون" },
};
const t = (k: string, ar: boolean) => (ar ? C[k]!.ar : C[k]!.en);

function productKind(handle: string): "tee" | "hoodie" | "sweatshirt" | "cap" | "beanie" | "tote" | "print" | "other" {
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
  tee: [["S", "46", "71"], ["M", "51", "74"], ["L", "56", "76"], ["XL", "61", "79"], ["2XL", "66", "81"]],
  hoodie: [["S", "51", "69"], ["M", "56", "71"], ["L", "61", "74"], ["XL", "66", "76"], ["2XL", "71", "79"]],
  sweatshirt: [["S", "51", "69"], ["M", "56", "71"], ["L", "61", "74"], ["XL", "66", "76"], ["2XL", "71", "79"]],
};

function fabricCopy(kind: ReturnType<typeof productKind>, ar: boolean): string {
  const en: Record<string, string> = {
    tee: "Soft ringspun cotton tee with a classic unisex fit. Machine wash cold inside out, tumble dry low, do not iron on the print.",
    hoodie: "Cotton-poly fleece hoodie with a front pouch pocket. Machine wash cold inside out, tumble dry low, do not iron on the print.",
    sweatshirt: "Cotton-poly fleece crewneck with ribbed cuffs. Machine wash cold inside out, tumble dry low, do not iron on the print.",
    cap: "Cotton twill dad cap with embroidered design and an adjustable strap. Spot clean only.",
    beanie: "Soft acrylic knit beanie with an embroidered cuff. Hand wash cold, lay flat to dry.",
    tote: "Sturdy cotton tote with long handles. Machine wash cold, line dry.",
    print: "Museum-quality matte poster paper. Frame not included. Keep out of direct sunlight.",
    other: "Printed on demand to high-quality standards.",
  };
  const arCopy: Record<string, string> = {
    tee: "تيشيرت قطني ناعم بقصة كلاسيكية للجنسين. يُغسل بماء بارد مقلوباً، ويُجفف على حرارة منخفضة، ولا يُكوى فوق الطباعة.",
    hoodie: "هودي من مزيج القطن والبوليستر مع جيب أمامي. يُغسل بماء بارد مقلوباً، ويُجفف على حرارة منخفضة، ولا يُكوى فوق الطباعة.",
    sweatshirt: "سويتشيرت بياقة دائرية وأساور مضلعة. يُغسل بماء بارد مقلوباً، ويُجفف على حرارة منخفضة، ولا يُكوى فوق الطباعة.",
    cap: "قبعة قطنية مطرزة بحزام قابل للتعديل. تُنظف موضعياً فقط.",
    beanie: "قبعة صوفية محبوكة بتطريز على الحافة. تُغسل يدوياً بماء بارد وتُجفف مسطحة.",
    tote: "حقيبة قطنية متينة بمقابض طويلة. تُغسل بماء بارد وتُجفف بالهواء.",
    print: "ورق ملصقات مطفي عالي الجودة. الإطار غير مشمول. يُحفظ بعيداً عن الشمس المباشرة.",
    other: "يُطبع عند الطلب بجودة عالية.",
  };
  return (ar ? arCopy : en)[kind]!;
}

export async function DesignStoryBlock({ handle, isArabic }: { handle: string; isArabic: boolean }) {
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
        <ChevronDownIcon aria-hidden className="size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-4 text-sm text-muted-foreground">{children}</div>
    </details>
  );
}

export function PdpTrustAndDetails({
  handle,
  isArabic,
  storySlot,
}: {
  handle: string;
  isArabic: boolean;
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
        <Link href="/designers/shirtat" className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">
          Shirtat
        </Link>
      </p>
      {storySlot}
      <div className="border-t border-border">
        {rows ? (
          <Accordion title={t("sizeGuide", isArabic)}>
            <div className="overflow-x-auto">
              <table className="w-full text-start">
                <thead>
                  <tr className="text-foreground">
                    <th className="py-1 text-start font-medium">{isArabic ? "المقاس" : "Size"}</th>
                    <th className="py-1 text-start font-medium">{isArabic ? "عرض الصدر (سم)" : "Chest width (cm)"}</th>
                    <th className="py-1 text-start font-medium">{isArabic ? "الطول (سم)" : "Length (cm)"}</th>
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
        <Accordion title={t("shipping", isArabic)}>
          <p>
            {isArabic
              ? "كل قطعة تُطبع خصيصاً لك بعد الطلب، ثم تُشحن إلى كل دولة يغطيها شركاؤنا في الطباعة عند الطلب."
              : "Each piece is printed just for you after you order, then shipped to every country our print-on-demand partners cover."}{" "}
            <Link href="/shipping" className="font-medium text-foreground underline underline-offset-4">
              {isArabic ? "تفاصيل الشحن" : "Shipping details"}
            </Link>
          </p>
        </Accordion>
      </div>
    </div>
  );
}

function Row({ title, products, isArabic }: { title: string; products: Awaited<ReturnType<typeof getMoreFromDesign>>; isArabic: boolean }) {
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

export async function MoreFromDesignRow({ handle, isArabic, locale }: { handle: string; isArabic: boolean; locale: CommerceLocale }) {
  const products = await getMoreFromDesign(handle, locale);
  return <Row title={t("more", isArabic)} products={products} isArabic={isArabic} />;
}

export async function AlsoLikeRow({ handle, isArabic, locale }: { handle: string; isArabic: boolean; locale: CommerceLocale }) {
  const { category } = await getPdpExtras(handle, isArabic);
  let products = category ? await getAlsoLike(handle, category, locale) : [];
  if (products.length < 2 && category !== "cultures") {
    products = await getAlsoLike(handle, "cultures", locale);
  }
  return <Row title={t("alsoLike", isArabic)} products={products} isArabic={isArabic} />;
}
