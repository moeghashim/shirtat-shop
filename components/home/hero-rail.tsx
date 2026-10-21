"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useCallback, useEffect, useState } from "react";

import { bannerItems } from "@/lib/banner";
import { CATEGORIES } from "@/lib/collections/categories";
import { localizeHref } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/client";

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

export function HeroRail() {
  const locale = useLocale();
  const ar = locale === "ar";
  const [open, setOpen] = useState<number | null>(null);
  const n = bannerItems.length;
  const go = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + n) % n)), [n]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") go(ar ? -1 : 1);
      if (e.key === "ArrowLeft") go(ar ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go, ar]);

  const name = (i: number) => (ar ? bannerItems[i].nameAr : bannerItems[i].nameEn);
  const cat = (i: number) => {
    const c = CATEGORIES.find((x) => x.id === bannerItems[i].category);
    return c ? (ar ? c.labelAr : c.labelEn) : "";
  };
  const price = (v: number) =>
    new Intl.NumberFormat(ar ? "ar" : "en-US", {
      currency: "USD",
      style: "currency",
      maximumFractionDigits: 0,
    }).format(v);
  const isOpen = open !== null;
  const ticker = ar
    ? ["تصاميم جديدة كل يوم", "خط عربي", "انضم كمبدع", "شعر", "فكاهة", "ثقافات", "مناسبات"]
    : [
        "New designs daily",
        "Arabic calligraphy",
        "Become a creator",
        "Poetry",
        "Humor",
        "Cultures",
        "Occasions",
      ];
  const yaw = ar ? -25 : 25;

  return (
    <section
      aria-label={ar ? "تصاميم مختارة" : "Featured designs"}
      className="relative overflow-hidden bg-[#efe8dc] text-[#1d1d1f]"
      style={{
        backgroundImage: "radial-gradient(rgba(0,0,0,0.13) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <div
        className="flex flex-col items-center gap-2 px-5 pt-8 text-center transition-opacity duration-500 motion-reduce:transition-none md:pt-10"
        style={{ opacity: isOpen ? 0 : 1 }}
      >
        <h1 className="max-w-3xl text-3xl font-semibold md:text-5xl">
          {ar ? "خط عربي، تلبسه" : "Arabic calligraphy, made to wear"}
        </h1>
        <p className="max-w-xl text-sm md:text-base text-[#1d1d1f]/75">
          {ar
            ? "«شيرتات» تعني «تيشيرتات». مرّر على الرف، واضغط على أي قطعة لتراها عن قرب."
            : "Shirtat means “t-shirts” in Arabic. Hover the rail and tap a piece to see it up close."}
        </p>
      </div>

      {/* Rail */}
      <div
        className="relative transition-[filter,opacity] duration-500 motion-reduce:transition-none"
        style={{ filter: isOpen ? "blur(10px)" : "none", opacity: isOpen ? 0.45 : 1 }}
        aria-hidden={isOpen}
      >
        <div className="overflow-x-auto overflow-y-visible [scrollbar-width:none] snap-x snap-mandatory md:snap-none">
          <div
            className="relative mx-auto w-max px-10 pt-14 pb-16 md:px-16"
            style={{ perspective: "1200px" }}
          >
            <div
              className="absolute inset-x-6 top-[3.6rem] h-[6px] rounded-full bg-gradient-to-b from-[#e9eaec] via-[#a9adb3] to-[#7d8187] shadow md:inset-x-10"
              aria-hidden
            >
              <span className="absolute -top-3 start-0 h-8 w-2 rounded bg-[#8b8f95]" />
              <span className="absolute -top-3 end-0 h-8 w-2 rounded bg-[#8b8f95]" />
            </div>
            <ul className="flex">
              {bannerItems.map((item, i) => (
                <li
                  key={item.slug}
                  className="group relative -ms-10 first:ms-0 snap-center hover:z-20 focus-within:z-20 md:-ms-12"
                >
                  <button
                    type="button"
                    onClick={() => setOpen(i)}
                    tabIndex={isOpen ? -1 : 0}
                    className="relative block w-[150px] [transform:rotateY(var(--yaw))] origin-top cursor-pointer outline-none transition-transform duration-500 group-hover:[transform:rotateY(0deg)_scale(1.4)_translateY(-4%)] focus-visible:[transform:rotateY(0deg)_scale(1.4)] motion-reduce:transition-none md:w-[180px]"
                    style={
                      { "--yaw": `${yaw}deg`, transitionTimingFunction: SPRING } as CSSProperties
                    }
                    aria-label={`${name(i)} – ${price(item.priceUsd)}`}
                  >
                    <Image
                      src={item.image}
                      alt={name(i)}
                      width={600}
                      height={720}
                      priority={i < 5}
                      className="h-auto w-full drop-shadow-[0_10px_12px_rgba(0,0,0,0.18)]"
                    />
                  </button>
                  <span
                    className={`pointer-events-none absolute inset-x-0 -bottom-6 text-center text-xs font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${ar ? "" : "italic"}`}
                  >
                    {name(i)} · {price(item.priceUsd)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div
        className="flex justify-center pb-6 transition-opacity duration-500 motion-reduce:transition-none"
        style={{ opacity: isOpen ? 0 : 1, pointerEvents: isOpen ? "none" : "auto" }}
      >
        <Link
          href={localizeHref(locale, "/collections/all")}
          className="rounded-full bg-[#1d1d1f] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:scale-105"
        >
          {ar ? "تسوّق الآن" : "Shop now"}
        </Link>
      </div>

      {/* Ticker */}
      <div
        className="overflow-hidden bg-[#1d1d1f] py-2.5 text-white transition-opacity duration-500"
        style={{ opacity: isOpen ? 0 : 1 }}
        dir="ltr"
        aria-hidden
      >
        <div className="flex w-max animate-[shirtat-marquee_30s_linear_infinite] motion-reduce:animate-none">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0">
              {[...ticker, ...ticker].map((t, j) => (
                <span
                  key={j}
                  className="px-5 text-xs font-semibold uppercase tracking-[0.2em] whitespace-nowrap"
                >
                  {t} <span className="ps-5 text-[#d9b45a]">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Detail view */}
      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={name(open)}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && setOpen(null)}
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            className="absolute top-4 end-4 flex items-center gap-1.5 rounded-full border border-[#1d1d1f]/30 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur"
          >
            {ar ? "إغلاق" : "Close"} <X className="size-3.5" />
          </button>
          <div className="text-xs font-semibold tracking-[0.2em]" dir="ltr">
            {String(open + 1).padStart(2, "0")}/{String(n).padStart(2, "0")}
          </div>
          <div className="flex items-center gap-4 md:gap-10">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={ar ? "السابق" : "Previous"}
              className="flex size-11 items-center justify-center rounded-full border border-[#1d1d1f]/40 bg-white/70 backdrop-blur transition hover:scale-110"
            >
              {ar ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
            </button>
            <div
              key={open}
              className="w-[220px] animate-[shirtat-pop_600ms_cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:animate-none md:w-[300px]"
            >
              <Image
                src={bannerItems[open].image}
                alt={name(open)}
                width={600}
                height={720}
                className="h-auto w-full drop-shadow-[0_18px_22px_rgba(0,0,0,0.25)]"
              />
            </div>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={ar ? "التالي" : "Next"}
              className="flex size-11 items-center justify-center rounded-full border border-[#1d1d1f]/40 bg-white/70 backdrop-blur transition hover:scale-110"
            >
              {ar ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
            </button>
          </div>
          <p className={`mt-1 text-2xl md:text-3xl ${ar ? "font-semibold" : "font-serif italic"}`}>
            {name(open)}
          </p>
          <p className="text-sm text-[#1d1d1f]/70">
            {cat(open)} · {price(bannerItems[open].priceUsd)} ·{" "}
            {ar ? "تصميم تجريبي" : "Example design"}
          </p>
          <Link
            href={localizeHref(locale, `/collections/${bannerItems[open].category}`)}
            className="mt-3 rounded-full bg-[#1d1d1f] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:scale-105"
          >
            {ar ? `تصفّح ${cat(open)}` : `Browse ${cat(open)}`}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
