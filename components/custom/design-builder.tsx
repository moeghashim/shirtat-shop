"use client";

import { cn } from "cn";
import Image from "next/image";
import { type CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useCartDrawer } from "@/components/cart/context";
import { Button } from "@/components/ui/button";
import { expandForm, type CompactForm } from "@/lib/custom/compact";
import { type ProductPhoto, productPhoto } from "@/lib/custom/mockups";
import { checkCustomText } from "@/lib/custom/moderation";
import {
  CUSTOM_PROPERTY,
  type CustomKind,
  MAX_CUSTOM_TEXT,
  MUG_REGIONS,
  type MugRegion,
} from "@/lib/custom/products";
import {
  DESIGN_PRESETS,
  DESIGN_STYLES,
  getStyle,
  presetArt,
  presetImage,
  styleImage,
} from "@/lib/custom/styles";
import { useLocale, useT } from "@/lib/i18n/client";
import { formatPrice } from "@/lib/money";
import { ProductProvider, useProduct, useProductForm } from "@/lib/product/client";
import type { ProductFormInput } from "@/lib/product/types";

import { fontFamily } from "./fonts";

const GARMENT_COLORS: Record<string, { ar: string; dark: boolean; hex: string }> = {
  "Athletic Heather": { ar: "رمادي مُبرقش", dark: false, hex: "#b7b9bd" },
  "Dark Chocolate": { ar: "بني داكن", dark: true, hex: "#3b2a22" },
  Black: { ar: "أسود", dark: true, hex: "#141414" },
  Maroon: { ar: "عنابي", dark: true, hex: "#6b1f2a" },
  Natural: { ar: "طبيعي", dark: false, hex: "#e8dfcf" },
  Navy: { ar: "كحلي", dark: true, hex: "#1d2a4a" },
  Olive: { ar: "زيتي", dark: true, hex: "#5b5e3a" },
  Sand: { ar: "رملي", dark: false, hex: "#d6c3a0" },
  "Sand Dune": { ar: "رملي", dark: false, hex: "#cdb99a" },
  "Soft Cream": { ar: "كريمي", dark: false, hex: "#f1e6cf" },
  "Sport Grey": { ar: "رمادي فاتح", dark: false, hex: "#c3c4c7" },
  White: { ar: "أبيض", dark: false, hex: "#f6f6f4" },
};

interface DesignBuilderProps {
  hoodie: CompactForm | null;
  mug: CompactForm | null;
  tee: CompactForm | null;
}

const KIND_LABEL: Record<CustomKind, string> = { hoodie: "Hoodie", mug: "Mug", tee: "T-shirt" };

export function DesignBuilder({ hoodie, mug, tee }: DesignBuilderProps) {
  const t = useT();
  const products = useMemo<Record<CustomKind, ProductFormInput | null>>(
    () => ({
      hoodie: hoodie && expandForm(hoodie),
      mug: mug && expandForm(mug),
      tee: tee && expandForm(tee),
    }),
    [hoodie, mug, tee],
  );
  const kinds = (["tee", "hoodie", "mug"] as const).filter((k) => products[k]);
  const [kind, setKind] = useState<CustomKind>(kinds[0] ?? "tee");
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("product");
    if ((wanted === "mug" || wanted === "hoodie" || wanted === "tee") && products[wanted])
      setKind(wanted);
    // Read the link's ?product= once, when the products arrive.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [hoodie, mug, tee]);
  const [text, setText] = useState("");
  const [styleId, setStyleId] = useState(2);
  const [presetId, setPresetId] = useState<number | null>(null);
  const product = products[kind];

  const steps = (
    <>
      <Step n={1} title={t("Choose a product")}>
        <div className="flex gap-2" role="group" aria-label={t("Choose a product")}>
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              className={cn(
                "h-11 min-w-28 cursor-pointer rounded-lg border px-5 text-sm transition-colors",
                kind === k
                  ? "border-foreground bg-foreground font-medium text-background"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
              )}
              onClick={() => setKind(k)}
            >
              {t(KIND_LABEL[k])}
            </button>
          ))}
        </div>
      </Step>

      <Step n={2} title={t("Your sentence")}>
        <TextField
          text={text}
          onChange={(v) => {
            setText(v);
            setPresetId(null);
          }}
        />
        <div className="grid gap-2.5">
          <p className="text-sm font-medium text-foreground/70">{t("Or start from an example")}</p>
          <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
            {DESIGN_PRESETS.map((p, index) => (
              <li key={p.id} className="shrink-0">
                <button
                  type="button"
                  aria-label={p.text}
                  aria-pressed={presetId === p.id}
                  className={cn(
                    "block size-24 cursor-pointer overflow-hidden rounded-xl border-2 bg-white transition-colors",
                    presetId === p.id
                      ? "border-foreground"
                      : "border-transparent hover:border-border",
                  )}
                  onClick={() => {
                    setText(p.text);
                    setPresetId(p.id);
                  }}
                >
                  <Image
                    alt=""
                    className="size-full object-cover"
                    height={96}
                    fetchPriority={index < 4 ? "auto" : "low"}
                    loading={index < 4 ? "eager" : "lazy"}
                    src={presetImage(p.id)}
                    unoptimized
                    width={96}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Step>

      <Step n={3} title={t("Calligraphy style")}>
        <p className="-mt-2 text-sm text-muted-foreground" aria-live="polite">
          {t("Selected style")}:{" "}
          <span className="font-semibold text-foreground">
            <SelectedStyleName styleId={styleId} />
          </span>
        </p>
        <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 xl:grid-cols-5" role="list">
          <StyleOptions
            styleId={styleId}
            onSelect={(id) => {
              // Picking a style means the customer wants their own text in it, so the example artwork steps aside.
              setStyleId(id);
              setPresetId(null);
            }}
          />
        </ul>
      </Step>
    </>
  );

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-14">
      {product ? (
        <ProductProvider key={kind} product={product}>
          <ProductPanel kind={kind} presetId={presetId} styleId={styleId} text={text}>
            {steps}
          </ProductPanel>
        </ProductProvider>
      ) : (
        <div className="grid content-start gap-9">{steps}</div>
      )}
    </div>
  );
}

function SelectedStyleName({ styleId }: { styleId: number }) {
  const locale = useLocale();
  const style = getStyle(styleId)!;
  return locale === "ar" ? style.nameAr : style.nameEn;
}

function StyleOptions({ onSelect, styleId }: { onSelect: (id: number) => void; styleId: number }) {
  const locale = useLocale();
  return DESIGN_STYLES.map((s) => (
    <li key={s.id}>
      <button
        type="button"
        aria-pressed={styleId === s.id}
        className={cn(
          "group grid w-full cursor-pointer gap-1.5 rounded-xl border-2 p-1.5 text-center transition-colors",
          styleId === s.id
            ? "relative border-foreground bg-foreground/5 shadow-sm ring-2 ring-foreground"
            : "border-transparent hover:border-border",
        )}
        onClick={() => onSelect(s.id)}
      >
        {styleId === s.id ? (
          <span
            aria-hidden
            className="absolute -top-2 -inset-e-2 z-10 grid size-6 place-items-center rounded-full bg-foreground text-xs text-background shadow"
          >
            ✓
          </span>
        ) : null}
        <Image
          alt=""
          className="aspect-square w-full rounded-lg object-cover"
          height={96}
          fetchPriority="low"
          loading="lazy"
          src={styleImage(s.id)}
          unoptimized
          width={96}
        />
        <span className={cn("text-xs leading-tight", styleId === s.id && "font-semibold")}>
          {locale === "ar" ? s.nameAr : s.nameEn}
        </span>
      </button>
    </li>
  ));
}

function Step({ children, n, title }: { children: React.ReactNode; n: number; title: string }) {
  return (
    <section className="grid gap-4">
      <h2 className="flex items-center gap-3 text-lg font-semibold">
        <span
          aria-hidden
          className="grid size-7 place-items-center rounded-full bg-foreground text-sm text-background"
        >
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function TextField({ onChange, text }: { onChange: (v: string) => void; text: string }) {
  const t = useT();
  const check = checkCustomText(text);
  const message =
    text.trim() === "" || check.ok
      ? null
      : {
          abuse: t("This text can't be printed. Please change it."),
          chars: t("Use Arabic or English letters, numbers and basic punctuation only."),
          empty: t("Add your sentence to continue."),
          link: t("Links, handles and phone numbers can't be printed."),
          long: t("Keep it under {max} characters.", { max: MAX_CUSTOM_TEXT }),
        }[check.reason];
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-foreground/70" htmlFor="design-text">
        {t("Your text, in Arabic, English or both")}
      </label>
      <textarea
        id="design-text"
        aria-describedby="design-text-help"
        aria-invalid={message ? true : undefined}
        className="min-h-24 w-full resize-y rounded-lg border border-border bg-background px-3.5 py-3 text-lg outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
        dir="auto"
        maxLength={MAX_CUSTOM_TEXT + 20}
        rows={2}
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex justify-between gap-4 text-xs" id="design-text-help">
        <p
          aria-live="polite"
          className={cn("min-h-4", message ? "text-destructive" : "text-muted-foreground")}
        >
          {message}
        </p>
        <p className="shrink-0 tabular-nums text-muted-foreground">
          {t("{n} of {max}", { max: MAX_CUSTOM_TEXT, n: text.trim().length })}
        </p>
      </div>
    </div>
  );
}

function ProductPanel({
  children,
  kind,
  presetId,
  styleId,
  text,
}: {
  children: React.ReactNode;
  kind: CustomKind;
  presetId: number | null;
  styleId: number;
  text: string;
}) {
  const t = useT();
  const locale = useLocale();
  const { options, selectOption, selectedVariant } = useProduct();
  const { formProps, pending, register } = useProductForm();
  const { openOverlay } = useCartDrawer();
  const style = getStyle(styleId)!;
  const check = checkCustomText(text);
  const selected = Object.fromEntries(
    (selectedVariant?.selectedOptions ?? []).map((o) => [o.name, o.value]),
  );
  const color = GARMENT_COLORS[selected.Color ?? ""];
  const onDark = kind !== "mug" && (color?.dark ?? false);

  useEffect(() => {
    if (kind !== "mug") return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.startsWith("Europe/")) selectOption("Ships to", MUG_REGIONS.eu.labelEn);
    // Only guess the region once, when the mug panel mounts.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const regionLabel = (name: string) => {
    const region = (Object.keys(MUG_REGIONS) as MugRegion[]).find(
      (r) => MUG_REGIONS[r].labelEn === name,
    );
    if (!region) return name;
    return locale === "ar" ? MUG_REGIONS[region].labelAr : MUG_REGIONS[region].labelEn;
  };
  const valueLabel = (optionName: string, name: string) => {
    if (optionName === "Ships to") return regionLabel(name);
    if (optionName === "Color" && locale === "ar") return GARMENT_COLORS[name]?.ar ?? name;
    if (optionName === "Fit") return t(name);
    return name;
  };
  const optionLabel = (name: string) => t(name === "Ships to" ? "Ships to" : name);

  const canAdd =
    check.ok && selectedVariant?.availableForSale !== false && Boolean(selectedVariant);
  const attrs: [string, string][] = check.ok
    ? [
        [CUSTOM_PROPERTY.text, check.text],
        [CUSTOM_PROPERTY.style, `${style.nameEn} (${style.id})`],
        ...(kind === "mug"
          ? []
          : ([[CUSTOM_PROPERTY.fit, kind === "hoodie" ? "Unisex" : (selected.Fit ?? "Men's")]] as [
              string,
              string,
            ][])),
        ...(presetId ? ([[CUSTOM_PROPERTY.preset, String(presetId)]] as [string, string][]) : []),
      ]
    : [];

  const label = `${t(KIND_LABEL[kind])}${selected.Color ? `, ${valueLabel("Color", selected.Color)}` : ""}`;
  const shownText = check.ok ? check.text : text.trim();
  const photo = productPhoto(kind, {
    color: selected.Color,
    fit: selected.Fit,
    size: selected.Size,
  });
  const art = presetId ? presetArt(presetId, onDark) : undefined;

  return (
    <>
      <PreviewDock
        art={art}
        garment={kind === "mug" ? "#ffffff" : (color?.hex ?? "#ffffff")}
        label={label}
        onDark={onDark}
        photo={photo}
        presetId={presetId}
        style={style}
        text={shownText}
        kind={kind}
      />

      <div className="mt-8 grid content-start gap-9 lg:col-start-1 lg:row-start-1 lg:mt-0">
        {children}

        <Step n={4} title={t("Options")}>
          <div className="grid gap-5">
            {options
              .filter((o) => o.values.length > 1)
              .map((option) => (
                <div key={option.name} className="grid gap-2.5">
                  <p className="text-sm font-medium text-foreground/70">
                    {optionLabel(option.name)}
                  </p>
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label={optionLabel(option.name)}
                  >
                    {option.values.map((value) => {
                      const swatch =
                        option.name === "Color" ? GARMENT_COLORS[value.name] : undefined;
                      return (
                        <button
                          key={value.name}
                          type="button"
                          aria-pressed={value.selected}
                          className={cn(
                            "inline-flex h-11 min-w-14 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                            value.selected
                              ? "border-foreground font-medium ring-1 ring-foreground"
                              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                          )}
                          // Switching fit is always allowed; the form then moves to the nearest colour that fit offers.
                          disabled={!value.exists && option.name !== "Fit"}
                          onClick={() => {
                            if (option.name === "Fit" && !value.exists) {
                              // The current colour isn't made in this fit, so move to the first colour that is.
                              const colors = options.find((o) => o.name === "Color")?.values ?? [];
                              for (const c of colors) {
                                if (!c.exists) continue;
                                selectOption("Color", c.name);
                                if (selectOption("Fit", value.name).status !== "invalid") return;
                              }
                              return;
                            }
                            selectOption(option.name, value.name);
                          }}
                        >
                          {swatch ? (
                            <span
                              aria-hidden
                              className="size-4 rounded-full border border-black/20"
                              style={{ background: swatch.hex }}
                            />
                          ) : null}
                          {valueLabel(option.name, value.name)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            {kind === "mug" ? (
              <p className="text-sm text-muted-foreground">
                {t("Mugs ship to the United States, Europe and the UK only.")}
              </p>
            ) : null}
            {kind === "hoodie" ? (
              <p className="text-sm text-muted-foreground">
                {t("Unisex fit. Order your usual size.")}
              </p>
            ) : null}
          </div>
        </Step>

        <form
          {...formProps({
            beforeSubmit: (event) => {
              if (!canAdd || pending) {
                event.preventDefault();
                return;
              }
              openOverlay();
            },
          })}
          className="grid gap-3"
        >
          <input type="hidden" {...register("merchandiseId", {})} />
          <input type="hidden" {...register("quantity", { value: 1 })} />
          {attrs.map(([key, value]) => (
            <input key={key} type="hidden" {...register("attributeValue", { key, value })} />
          ))}
          <div className="flex items-center gap-4">
            <p className="text-2xl font-semibold tabular-nums">
              {selectedVariant ? formatPrice(selectedVariant.price) : null}
            </p>
            <Button
              {...register("addToCart", {})}
              className="h-12 flex-1 justify-center"
              disabled={!canAdd || pending}
            >
              {pending ? t("Adding…") : t("Add to Cart")}
            </Button>
          </div>
          {!check.ok && text.trim() === "" ? (
            <p className="text-xs text-muted-foreground">{t("Add your sentence to continue.")}</p>
          ) : null}
        </form>
      </div>
    </>
  );
}

function PreviewDock({
  art,
  garment,
  kind,
  label,
  onDark,
  photo,
  presetId,
  style,
  text,
}: {
  art?: string;
  garment: string;
  kind: CustomKind;
  label: string;
  onDark: boolean;
  photo: ProductPhoto;
  presetId: number | null;
  style: NonNullable<ReturnType<typeof getStyle>>;
  text: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const stage = (width: string) => (
    <div className="grid justify-items-center gap-3">
      <div className="w-full" style={{ width }}>
        <Preview
          art={art}
          fontKey={style.font}
          kind={kind}
          label={label}
          onDark={onDark}
          photo={photo}
          text={text}
          vertical={Boolean(style.vertical)}
        />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {presetId
          ? t("Example artwork shown on your product. A designer prepares your print to match it.")
          : t("Rough layout preview. Our designer hand-finishes your text in the selected style.")}
      </p>
      {presetId ? null : <StyleSample style={style} />}
    </div>
  );

  return (
    <aside
      aria-label={t("Preview")}
      className="sticky top-[4.5rem] z-20 md:top-24 lg:col-start-2 lg:row-start-1 lg:top-28 lg:self-start"
    >
      {/* Large preview that stays in view next to the form on desktop. */}
      <div className="hidden lg:block">{stage("max(280px, min(100%, calc(100dvh - 17rem)))")}</div>

      {/* Compact preview pinned above the form on small screens; tap to enlarge. */}
      <div className="lg:hidden">
        <button
          type="button"
          aria-controls="design-preview-panel"
          aria-expanded={open}
          className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background p-2 text-start shadow-sm"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block size-21 shrink-0">
            <Preview
              art={art}
              fontKey={style.font}
              kind={kind}
              label={label}
              onDark={onDark}
              photo={photo}
              text={text}
              vertical={Boolean(style.vertical)}
            />
          </span>
          <span
            className="relative grid h-21 min-w-0 flex-1 place-items-center overflow-hidden rounded-xl px-2"
            style={{ background: garment }}
          >
            {art ? (
              <Image
                alt=""
                className="size-full object-contain"
                height={84}
                src={art}
                unoptimized
                width={84}
              />
            ) : (
              <FitText
                fontKey={style.font}
                ink={onDark ? "#f4f4f4" : "#141414"}
                text={text}
                vertical={false}
              />
            )}
          </span>
          <span className="shrink-0 px-1 text-xs text-muted-foreground" aria-hidden>
            {open ? t("Close") : t("Enlarge")}
          </span>
        </button>
        {open ? (
          <div
            id="design-preview-panel"
            className="absolute inset-x-0 top-full mt-2 max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-2xl border border-border bg-background p-3 shadow-lg"
          >
            {stage("min(100%, 50dvh)")}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function StyleSample({ style }: { style: NonNullable<ReturnType<typeof getStyle>> }) {
  const t = useT();
  const locale = useLocale();
  const name = locale === "ar" ? style.nameAr : style.nameEn;
  return (
    <div
      className="flex w-full max-w-lg items-center gap-3 rounded-xl border border-border bg-background p-2.5"
      data-testid="style-sample"
    >
      <Image
        alt={name}
        className="size-16 shrink-0 rounded-lg bg-white object-cover"
        height={64}
        src={styleImage(style.id)}
        unoptimized
        width={64}
      />
      <div className="grid gap-0.5">
        <p className="text-sm font-semibold">
          {t("Your text in this style")}: <span className="font-normal">{name}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {t("Sample of the finished look. Your words will be drawn in this hand.")}
        </p>
      </div>
    </div>
  );
}

function Preview({
  art,
  fontKey,
  kind,
  label,
  onDark,
  photo,
  text,
  vertical,
}: {
  art?: string;
  fontKey: Parameters<typeof fontFamily>[0];
  kind: CustomKind;
  label: string;
  onDark: boolean;
  photo: ProductPhoto;
  text: string;
  vertical: boolean;
}) {
  const [left, top, width, height] = photo.art;
  // Ink is printed, so on light fabric it multiplies into the shading; on dark fabric it stays light.
  const blend = onDark ? "" : "mix-blend-multiply";
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white">
      <Image
        alt={label}
        className="absolute inset-0 size-full object-cover"
        data-testid="product-photo"
        height={800}
        loading="lazy"
        sizes="(min-width: 1024px) 640px, 100vw"
        src={photo.src}
        unoptimized
        width={800}
      />
      <div
        className={cn("absolute grid place-items-center", blend)}
        data-kind={kind}
        style={{
          height: `${height}%`,
          left: `${left}%`,
          top: `${top}%`,
          width: `${width}%`,
        }}
      >
        {art ? (
          <Image
            alt=""
            className={cn("size-full object-contain object-top", onDark ? "opacity-95" : "")}
            height={248}
            src={art}
            unoptimized
            width={248}
          />
        ) : (
          <FitText
            ink={onDark ? "#f4f4f4" : "#141414"}
            fontKey={fontKey}
            text={text}
            vertical={vertical}
          />
        )}
      </div>
    </div>
  );
}

function FitText({
  fontKey,
  ink,
  text,
  vertical,
}: {
  fontKey: Parameters<typeof fontFamily>[0];
  ink: string;
  text: string;
  vertical: boolean;
}) {
  const t = useT();
  const boxRef = useRef<HTMLDivElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(40);
  const shown = text || t("Your sentence");
  const content = useMemo(
    () => (vertical ? shown.split(" ").filter(Boolean).join("\n") : shown),
    [shown, vertical],
  );

  useLayoutEffect(() => {
    const box = boxRef.current;
    const span = spanRef.current;
    if (!box || !span) return;
    const range = document.createRange();
    range.selectNodeContents(span);
    let seen = "";
    const fit = (force: boolean) => {
      const maxH = box.clientHeight;
      const maxW = box.clientWidth;
      // A preview hidden at this screen size has nothing to fit.
      if (!maxH || !maxW) return;
      const key = `${maxW}x${maxH}`;
      if (!force && key === seen) return;
      seen = key;
      let lo = 8;
      let hi = Math.max(8, maxH * 0.8);
      for (let i = 0; i < 8; i++) {
        const mid = (lo + hi) / 2;
        span.style.fontSize = `${mid}px`;
        // The text range reports glyph extents on both sides; scrollWidth misses overflow on the start edge of RTL text.
        const extent = range.getBoundingClientRect();
        if (extent.height <= maxH + 0.5 && extent.width <= maxW + 0.5) lo = mid;
        else hi = mid;
      }
      span.style.fontSize = `${lo}px`;
      setSize(Math.floor(lo));
    };
    fit(true);
    const ro = new ResizeObserver(() => fit(false));
    ro.observe(box);
    const onFonts = () => fit(true);
    document.fonts?.addEventListener("loadingdone", onFonts);
    return () => {
      ro.disconnect();
      document.fonts?.removeEventListener("loadingdone", onFonts);
    };
  }, [content, fontKey]);

  const style: CSSProperties = {
    color: ink,
    // The empty placeholder stays in the site font so the design fonts load only once there is text to draw.
    fontFamily: text ? fontFamily(fontKey) : undefined,
    fontSize: size,
    lineHeight: 1.35,
    opacity: text ? 1 : 0.35,
    display: "block",
    overflowWrap: "normal",
    textAlign: "center",
    unicodeBidi: "plaintext",
    whiteSpace: "pre-line",
    width: "100%",
  };
  return (
    <div ref={boxRef} className="grid size-full grid-cols-[minmax(0,1fr)] place-items-center">
      <span ref={spanRef} dir="auto" style={style}>
        {content}
      </span>
    </div>
  );
}
