import Image from "next/image";

import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { CATEGORIES } from "@/lib/collections/categories";
import { type HomeProduct, getHomeProducts } from "@/lib/home/server";
import { getLocale, getT } from "@/lib/i18n/server";

type Translate = Awaited<ReturnType<typeof getT>>;

const CATEGORY_STYLE: Record<string, { bg: string; glyph: string }> = {
  cultures: { bg: "from-emerald-900 to-teal-700", glyph: "ثقافات" },
  humor: { bg: "from-amber-600 to-orange-500", glyph: "فكاهة" },
  occasions: { bg: "from-rose-800 to-fuchsia-700", glyph: "مناسبات" },
  poetry: { bg: "from-stone-900 to-stone-700", glyph: "شعر" },
};

const PRODUCT_TYPES = [
  { handle: "t-shirts", search: "T-shirt", label: "T-shirts", type: "T-Shirt" },
  { handle: "hoodies", search: "Hoodie", label: "Hoodies", type: "Hoodie" },
  { handle: "sweatshirts", search: "Sweatshirt", label: "Sweatshirts", type: "Sweatshirt" },
  { handle: "tote-bags", search: "Tote", label: "Tote bags", type: "Tote Bag" },
  { handle: "posters-prints", search: "Print", label: "Prints", type: "Poster" },
];

/** "English (العربية) Type" → the part for the current locale. */
export function localTitle(title: string, locale: string): string {
  const m = title.match(/^(.*?)\s*\(([^)]+)\)\s*(.*)$/);
  if (!m) return title;
  return locale === "ar" ? m[2]! : `${m[1]}${m[3] ? ` ${m[3]}` : ""}`;
}

function SectionHeader({ eyebrow, title, href, linkText }: { eyebrow?: string; href?: string; linkText?: string; title: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        )}
        <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
      </div>
      {href && linkText && (
        <Link className="shrink-0 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" href={href}>
          {linkText}
        </Link>
      )}
    </div>
  );
}

export async function CategoryTiles() {
  const t = await getT();
  const locale = await getLocale();
  return (
    <Container>
      <SectionHeader eyebrow={t("Categories")} title={t("Shop by category")} />
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {CATEGORIES.map((c) => {
          const style = CATEGORY_STYLE[c.id] ?? CATEGORY_STYLE.poetry!;
          return (
            <li key={c.id}>
              <Link
                className={`group relative flex h-32 flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br ${style.bg} p-4 text-white sm:h-auto sm:aspect-square sm:rounded-3xl sm:p-5`}
                href={`/collections/${c.id}`}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-2 end-3 font-serif text-5xl leading-none opacity-25 transition-transform duration-500 group-hover:scale-110 sm:text-8xl"
                  dir="rtl"
                >
                  {style.glyph}
                </span>
                <span className="text-lg font-semibold sm:text-2xl">{locale === "ar" ? c.labelAr : c.labelEn}</span>
                <span className="mt-1 line-clamp-2 hidden text-xs text-white/80 sm:block sm:text-sm">
                  {locale === "ar" ? c.descriptionAr : c.descriptionEn}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}

function pickByType(products: HomeProduct[], type: string) {
  return products.find((p) => p.productType === type && p.image);
}

export async function ProductTypeRow() {
  const t = await getT();
  const products = await getHomeProducts();
  return (
    <Container>
      <SectionHeader eyebrow={t("Products")} title={t("Shop by product")} />
      <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
        {PRODUCT_TYPES.map((pt) => {
          const p = pickByType(products, pt.type);
          return (
            <li className="w-40 shrink-0 snap-start md:w-auto" key={pt.handle}>
              <Link className="group block" href={`/search?q=${encodeURIComponent(pt.search)}`}>
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                  {p?.image && (
                    <Image
                      alt=""
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      fill
                      sizes="(min-width: 768px) 20vw, 160px"
                      src={p.image.url}
                    />
                  )}
                </div>
                <p className="mt-2 text-center font-medium">{t(pt.label)}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}

const SPOTLIGHT = {
  handle: "tafakkar",
  quoteAr: "تفكّر",
  textAr: "كلمة واحدة تدعوك إلى التأمّل: تفكّر في نفسك، وفي العالم من حولك. خطٌّ عربي جريء على قطعٍ تُرتدى كل يوم.",
  textEn: "One word, an invitation to reflect: on yourself and the world around you. Bold Arabic calligraphy on pieces made for every day.",
  titleEn: "Tafakkar: Reflect",
};

export async function DesignSpotlight() {
  const t = await getT();
  const locale = await getLocale();
  const products = (await getHomeProducts()).filter((p) => p.handle.startsWith(`${SPOTLIGHT.handle}-`));
  if (products.length === 0) return null;
  const hero = products.find((p) => p.productType === "T-Shirt") ?? products[0]!;
  const rest = products.filter((p) => p !== hero).slice(0, 4);
  return (
    <Container>
      <section className="grid items-center gap-8 overflow-hidden rounded-3xl bg-muted/60 p-6 md:grid-cols-2 md:p-12">
        <Link className="group relative block aspect-square overflow-hidden rounded-2xl bg-background" href={`/products/${hero.handle}`}>
          {hero.image && (
            <Image
              alt={localTitle(hero.title, locale)}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              fill
              sizes="(min-width: 768px) 45vw, 90vw"
              src={hero.image.url}
            />
          )}
        </Link>
        <div className="flex flex-col gap-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{t("Design spotlight")}</p>
          <p className="font-serif text-5xl md:text-7xl" dir="rtl" lang="ar">{SPOTLIGHT.quoteAr}</p>
          <h2 className="text-2xl font-semibold md:text-3xl">{locale === "ar" ? "تفكّر" : SPOTLIGHT.titleEn}</h2>
          <p className="text-muted-foreground md:text-lg">{locale === "ar" ? SPOTLIGHT.textAr : SPOTLIGHT.textEn}</p>
          <ul className="mt-2 grid grid-cols-4 gap-3">
            {rest.map((p) => (
              <li key={p.handle}>
                <Link className="relative block aspect-square overflow-hidden rounded-xl bg-background" href={`/products/${p.handle}`}>
                  {p.image && <Image alt={localTitle(p.title, locale)} className="object-cover" fill sizes="96px" src={p.image.url} />}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            className="mt-2 inline-flex w-fit rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            href={`/products/${hero.handle}`}
          >
            {t("Shop the design")}
          </Link>
        </div>
      </section>
    </Container>
  );
}

function CtaCard({ body, cta, href, title, dark, eyebrow }: { body: string; cta: string; dark?: boolean; eyebrow: string; href: string; title: string }) {
  return (
    <Link
      className={`group flex flex-col justify-between gap-6 rounded-3xl p-6 sm:p-8 md:p-10 ${dark ? "bg-foreground text-background" : "border border-border bg-background"}`}
      href={href}
    >
      <div className="flex flex-col gap-3">
        <p className={`text-xs font-medium uppercase tracking-[0.2em] ${dark ? "text-background/70" : "text-muted-foreground"}`}>{eyebrow}</p>
        <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
        <p className={dark ? "text-background/80" : "text-muted-foreground"}>{body}</p>
      </div>
      <span className="text-sm font-semibold">
        {cta} <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1">→</span>
      </span>
    </Link>
  );
}

export async function DesignersAndSell() {
  const t: Translate = await getT();
  return (
    <Container>
      <div className="grid gap-5 md:grid-cols-2">
        <CtaCard
          body={t("Every piece is made by a designer. Browse by the people behind the calligraphy, starting with the Shirtat studio.")}
          cta={t("Meet the designers")}
          eyebrow={t("Designers")}
          href="/designers"
          title={t("Shop by designer")}
        />
        <CtaCard
          body={t("Have Arabic designs people would love to wear? Upload them, we print and ship, and you earn on every sale.")}
          cta={t("Start selling")}
          dark
          eyebrow={t("For designers")}
          href="/creators"
          title={t("Sell on Shirtat")}
        />
      </div>
    </Container>
  );
}

export async function NewArrivals() {
  const t = await getT();
  const locale = await getLocale();
  const all = (await getHomeProducts()).filter((p) => p.image);
  // Interleave designs so the grid shows variety rather than five of one design.
  const byDesign = new Map<string, HomeProduct[]>();
  for (const p of all) {
    const key = p.title.replace(/\s*\S+$/, "");
    byDesign.set(key, [...(byDesign.get(key) ?? []), p]);
  }
  const groups = [...byDesign.values()];
  const picks: HomeProduct[] = [];
  for (let i = 0; picks.length < 8 && groups.some((g) => g[i]); i++) {
    for (const g of groups) if (g[i] && picks.length < 8) picks.push(g[i]!);
  }
  if (picks.length === 0) return null;
  const fmt = new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-latn" : "en-US", { currency: "USD", style: "currency" });
  return (
    <Container>
      <SectionHeader href="/collections/all" linkText={t("View All")} title={t("New arrivals")} />
      <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-5 lg:grid-cols-4">
        {picks.map((p, i) => (
          <li key={p.handle}>
            <Link className="group block" href={`/products/${p.handle}`}>
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                <Image
                  alt={localTitle(p.title, locale)}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  fill
                  loading={i < 4 ? "eager" : "lazy"}
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  src={p.image!.url}
                />
              </div>
              <p className="mt-3 line-clamp-1 font-medium">{localTitle(p.title, locale)}</p>
              <p className="text-sm text-muted-foreground">
                {t(PRODUCT_TYPES.find((x) => x.type === p.productType)?.label ?? p.productType)} ·{" "}
                {fmt.format(Number(p.price.amount))}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
