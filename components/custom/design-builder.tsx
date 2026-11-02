"use client";

import { cn } from "cn";
import Image from "next/image";
import { type CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useCartDrawer } from "@/components/cart/context";
import { Button } from "@/components/ui/button";
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
  Black: { ar: "أسود", dark: true, hex: "#141414" },
  Maroon: { ar: "عنابي", dark: true, hex: "#6b1f2a" },
  Natural: { ar: "طبيعي", dark: false, hex: "#e8dfcf" },
  Navy: { ar: "كحلي", dark: true, hex: "#1d2a4a" },
  Olive: { ar: "زيتي", dark: true, hex: "#5b5e3a" },
  "Sand Dune": { ar: "رملي", dark: false, hex: "#cdb99a" },
  "Soft Cream": { ar: "كريمي", dark: false, hex: "#f1e6cf" },
  White: { ar: "أبيض", dark: false, hex: "#f6f6f4" },
};

interface DesignBuilderProps {
  mug: ProductFormInput | null;
  tee: ProductFormInput | null;
}

export function DesignBuilder({ mug, tee }: DesignBuilderProps) {
  const t = useT();
  const kinds = [tee && "tee", mug && "mug"].filter(Boolean) as CustomKind[];
  const [kind, setKind] = useState<CustomKind>(kinds[0] ?? "tee");
  useEffect(() => {
    if (mug && new URLSearchParams(window.location.search).get("product") === "mug") setKind("mug");
  }, [mug]);
  const [text, setText] = useState("");
  const [styleId, setStyleId] = useState(2);
  const [presetId, setPresetId] = useState<number | null>(null);
  const product = kind === "mug" ? mug : tee;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
      <div className="grid content-start gap-9">
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
                {k === "tee" ? t("T-shirt") : t("Mug")}
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
            <p className="text-sm font-medium text-foreground/70">
              {t("Or start from an example")}
            </p>
            <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
              {DESIGN_PRESETS.map((p) => (
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
          <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 xl:grid-cols-5" role="list">
            <StyleOptions styleId={styleId} onSelect={setStyleId} />
          </ul>
        </Step>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        {product ? (
          <ProductProvider key={kind} product={product}>
            <ProductPanel kind={kind} presetId={presetId} styleId={styleId} text={text} />
          </ProductProvider>
        ) : null}
      </div>
    </div>
  );
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
          styleId === s.id ? "border-foreground" : "border-transparent hover:border-border",
        )}
        onClick={() => onSelect(s.id)}
      >
        <Image
          alt=""
          className="aspect-square w-full rounded-lg object-cover"
          height={96}
          loading="lazy"
          src={styleImage(s.id)}
          unoptimized
          width={96}
        />
        <span className="text-xs leading-tight">{locale === "ar" ? s.nameAr : s.nameEn}</span>
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
  kind,
  presetId,
  styleId,
  text,
}: {
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
    return name;
  };
  const optionLabel = (name: string) => t(name === "Ships to" ? "Ships to" : name);

  const canAdd =
    check.ok && selectedVariant?.availableForSale !== false && Boolean(selectedVariant);
  const attrs: [string, string][] = check.ok
    ? [
        [CUSTOM_PROPERTY.text, check.text],
        [CUSTOM_PROPERTY.style, `${style.nameEn} (${style.id})`],
        ...(presetId ? ([[CUSTOM_PROPERTY.preset, String(presetId)]] as [string, string][]) : []),
      ]
    : [];

  return (
    <div className="grid gap-6">
      <section aria-label={t("Preview")} className="grid gap-3">
        <Preview
          dark={color?.dark ?? false}
          fontKey={style.font}
          garment={color?.hex ?? "#f6f6f4"}
          kind={kind}
          text={check.ok ? check.text : text.trim()}
          vertical={Boolean(style.vertical)}
        />
        <p className="text-center text-xs text-muted-foreground">
          {t("Approximate preview. A designer sets the final artwork in your style.")}
        </p>
      </section>

      <Step n={4} title={t("Options")}>
        <div className="grid gap-5">
          {options
            .filter((o) => o.values.length > 1)
            .map((option) => (
              <div key={option.name} className="grid gap-2.5">
                <p className="text-sm font-medium text-foreground/70">{optionLabel(option.name)}</p>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label={optionLabel(option.name)}
                >
                  {option.values.map((value) => {
                    const swatch = option.name === "Color" ? GARMENT_COLORS[value.name] : undefined;
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
                        disabled={!value.exists}
                        onClick={() => selectOption(option.name, value.name)}
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
  );
}

function Preview({
  dark,
  fontKey,
  garment,
  kind,
  text,
  vertical,
}: {
  dark: boolean;
  fontKey: Parameters<typeof fontFamily>[0];
  garment: string;
  kind: CustomKind;
  text: string;
  vertical: boolean;
}) {
  const isTee = kind === "tee";
  const ink = isTee && dark ? "#f4f4f4" : "#141414";
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl bg-muted",
        isTee ? "aspect-[10/11]" : "aspect-[4/3]",
      )}
    >
      <svg
        aria-hidden
        className="absolute inset-0 size-full"
        viewBox={isTee ? "0 0 400 440" : "0 0 400 300"}
      >
        {isTee ? (
          <path
            d="M130 40 L60 70 L18 152 L76 178 L96 142 V402 H304 V142 L324 178 L382 152 L340 70 L270 40 Q200 84 130 40 Z"
            fill={garment}
            stroke="rgba(0,0,0,.18)"
            strokeWidth="2"
          />
        ) : (
          <g>
            <path
              d="M292 100 Q372 96 366 160 Q360 214 286 212"
              fill="none"
              stroke="#efefec"
              strokeLinecap="round"
              strokeWidth="26"
            />
            <path
              d="M292 100 Q372 96 366 160 Q360 214 286 212"
              fill="none"
              stroke="rgba(0,0,0,.14)"
              strokeLinecap="round"
              strokeWidth="2"
              transform="translate(0 -13)"
            />
            <rect
              fill="#f8f8f6"
              height="190"
              rx="16"
              stroke="rgba(0,0,0,.18)"
              strokeWidth="2"
              width="226"
              x="64"
              y="56"
            />
          </g>
        )}
      </svg>
      <div
        className="absolute grid place-items-center overflow-hidden"
        style={
          isTee
            ? { height: "34%", insetInlineStart: "31%", top: "24%", width: "38%" }
            : { height: "58%", insetInlineStart: "19%", top: "24%", width: "50%" }
        }
      >
        <FitText ink={ink} fontKey={fontKey} text={text} vertical={vertical} />
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
    const fit = () => {
      const maxH = box.clientHeight;
      const maxW = box.clientWidth;
      let lo = 8;
      let hi = Math.max(8, maxH * 0.8);
      for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2;
        span.style.fontSize = `${mid}px`;
        if (span.scrollHeight <= maxH && span.scrollWidth <= maxW) lo = mid;
        else hi = mid;
      }
      span.style.fontSize = `${lo}px`;
      setSize(Math.floor(lo));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    document.fonts?.addEventListener("loadingdone", fit);
    return () => {
      ro.disconnect();
      document.fonts?.removeEventListener("loadingdone", fit);
    };
  }, [content, fontKey]);

  const style: CSSProperties = {
    color: ink,
    fontFamily: fontFamily(fontKey),
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
    <div ref={boxRef} className="grid size-full place-items-center">
      <span ref={spanRef} dir="auto" style={style}>
        {content}
      </span>
    </div>
  );
}
