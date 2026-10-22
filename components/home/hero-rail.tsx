"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { HeroRack } from "@/components/home/hero-rack";
import { bannerItems } from "@/lib/banner";
import { localizeHref } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/client";

const PEGBOARD =
  "radial-gradient(circle at center, transparent 2.6px, rgba(40,48,80,0.09) 3px, rgba(40,48,80,0.09) 3.8px, transparent 4.2px)";

const PILL =
  "rounded-full border border-[#3d4670]/60 px-5 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#3d4670] transition hover:bg-[#3d4670] hover:text-white";

export function HeroRail() {
  const locale = useLocale();
  const ar = locale === "ar";
  const [open, setOpen] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const n = bannerItems.length;
  const go = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + n) % n)), [n]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, []);

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
  const isOpen = open !== null;
  const ticker = ar
    ? ["تصاميم جديدة كل يوم", "خط عربي", "انضم كمصمم", "شعر", "فكاهة", "ثقافات", "مناسبات"]
    : [
        "New designs daily",
        "Arabic calligraphy",
        "Become a designer",
        "Poetry",
        "Humor",
        "Cultures",
        "Occasions",
      ];
  const fade = { opacity: isOpen ? 0 : 1 };

  return (
    <section
      aria-label={ar ? "تصاميم مختارة" : "Featured designs"}
      className="relative overflow-hidden bg-[#e6e6e2] text-[#3d4670]"
      style={{ backgroundImage: PEGBOARD, backgroundSize: "34px 34px" }}
    >
      <h1 className="sr-only">{ar ? "خط عربي، تلبسه" : "Arabic calligraphy, made to wear"}</h1>

      <div
        className="relative transition-[filter,opacity] duration-500 motion-reduce:transition-none"
        style={{ filter: isOpen ? "blur(10px)" : "none", opacity: isOpen ? 0.45 : 1 }}
        aria-hidden={isOpen}
      >
        <div ref={scroller} className="overflow-x-auto [scrollbar-width:none]">
          <div className="relative mx-auto w-max pt-14 pb-4 [--w:150px] md:pt-20 md:[--w:230px]">
            <HeroRack
              ar={ar}
              items={bannerItems}
              locked={isOpen}
              onOpen={setOpen}
              scroller={scroller}
            />
          </div>
        </div>
      </div>

      <div
        className="flex justify-center pt-4 pb-10 transition-opacity duration-500 motion-reduce:transition-none"
        style={{ ...fade, pointerEvents: isOpen ? "none" : "auto" }}
      >
        <Link href={localizeHref(locale, "/collections/all")} className={PILL}>
          {ar ? "تسوّق الآن" : "Shop now"}
        </Link>
      </div>

      <div
        className="overflow-hidden bg-[#4b5680] py-2.5 text-white transition-opacity duration-500"
        style={fade}
        dir="ltr"
        aria-hidden
      >
        <div className="flex w-max animate-[shirtat-marquee_40s_linear_infinite] motion-reduce:animate-none">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0">
              {[...ticker, ...ticker].map((t, j) => (
                <span
                  key={j}
                  className={`px-4 text-xs tracking-wide whitespace-nowrap ${ar ? "font-medium" : "italic uppercase"}`}
                >
                  {t} <span className="ps-4 not-italic">•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={name(open)}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-1"
          onClick={(e) => e.target === e.currentTarget && setOpen(null)}
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            className="absolute top-5 end-6 cursor-pointer text-xs font-medium uppercase tracking-[0.14em] transition hover:opacity-60"
          >
            {ar ? "إغلاق" : "Close"}
          </button>
          <div className="flex items-center gap-4 md:gap-16">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={ar ? "السابق" : "Previous"}
              className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-[#3d4670]/50 transition hover:bg-[#3d4670] hover:text-white"
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
                width={800}
                height={960}
                className="h-auto w-full drop-shadow-[0_18px_22px_rgba(0,0,0,0.22)]"
              />
            </div>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={ar ? "التالي" : "Next"}
              className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-[#3d4670]/50 transition hover:bg-[#3d4670] hover:text-white"
            >
              {ar ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
            </button>
          </div>
          <div className="text-xs tracking-[0.14em] text-[#3d4670]/70" dir="ltr">
            {String(open + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </div>
          <p className={`text-2xl md:text-3xl ${ar ? "font-semibold" : "font-serif italic"}`}>
            {name(open)}
          </p>
          <Link href={localizeHref(locale, bannerItems[open].href)} className={`mt-3 ${PILL}`}>
            {ar ? "تسوّق الآن" : "Shop now"}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
