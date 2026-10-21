"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react";

import { bannerItems } from "@/lib/banner";
import { CATEGORIES } from "@/lib/collections/categories";
import { localizeHref } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/client";

const SIDE_YAW = 72;
const SIDE_SLOT = 0.24;
const FRONT_SLOT = 0.82;

const PEGBOARD =
  "radial-gradient(circle at center, transparent 2.6px, rgba(40,48,80,0.09) 3px, rgba(40,48,80,0.09) 3.8px, transparent 4.2px)";

const PILL =
  "rounded-full border border-[#3d4670]/60 px-5 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#3d4670] transition hover:bg-[#3d4670] hover:text-white";

export function HeroRail() {
  const locale = useLocale();
  const ar = locale === "ar";
  const [open, setOpen] = useState<number | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const rack = useRef<HTMLUListElement>(null);
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
  const yaw = ar ? -SIDE_YAW : SIDE_YAW;
  const track = (e: PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse") return;
    const ul = rack.current;
    if (!ul) return;
    const current = active === null ? null : ul.children[active]?.getBoundingClientRect();
    if (current && e.clientX >= current.left && e.clientX <= current.right) return;
    const rect = ul.getBoundingClientRect();
    const w = Number.parseFloat(getComputedStyle(ul).getPropertyValue("--w"));
    const slot = w * SIDE_SLOT;
    const start = rect.left + (rect.width - slot * n) / 2;
    const raw = Math.floor((e.clientX - start) / slot);
    const idx = ar ? n - 1 - raw : raw;
    setActive(raw < 0 || raw >= n ? null : idx);
  };
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
          <div className="relative mx-auto w-max px-8 pt-14 pb-4 [--w:170px] md:px-16 md:pt-20 md:[--w:230px]">
            <div className="relative">
              <div
                className="absolute inset-x-0 z-0 h-[9px] rounded-full bg-gradient-to-b from-[#fafafb] via-[#a7acb2] to-[#e4e6e9] shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
                style={{ top: "calc(var(--w) * 1.2 * 0.062 - 4px)" }}
                aria-hidden
              >
                {["-start-3", "-end-3"].map((side) => (
                  <span
                    key={side}
                    className={`absolute -top-3.5 ${side} flex h-9 w-3.5 flex-col items-center justify-between rounded-[3px] bg-gradient-to-r from-[#dfe1e4] to-[#9da2a8] py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.3)]`}
                  >
                    <span className="size-1 rounded-full bg-[#6b7077]" />
                    <span className="size-1 rounded-full bg-[#6b7077]" />
                  </span>
                ))}
              </div>

              <ul
                ref={rack}
                className="relative z-10 flex justify-center"
                style={{ width: `calc(var(--w) * ${(n - 1) * SIDE_SLOT + FRONT_SLOT + 0.7})` }}
                onPointerLeave={() => setActive(null)}
                onPointerMove={track}
              >
                {bannerItems.map((item, i) => {
                  const front = active === i;
                  return (
                    <li
                      key={item.slug}
                      className="relative shrink-0 transition-[width] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                      style={{
                        width: `calc(var(--w) * ${front ? FRONT_SLOT : SIDE_SLOT})`,
                        zIndex: front ? 20 : 0,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpen(i)}
                        onFocus={() => setActive(i)}
                        onBlur={() => setActive(null)}
                        tabIndex={isOpen ? -1 : 0}
                        className="absolute inset-0 block cursor-pointer outline-none"
                        aria-label={`${name(i)} – ${price(item.priceUsd)}`}
                      >
                        {item.sideImage ? (
                          <span
                            className="absolute top-0 left-1/2 block w-(--w) -translate-x-1/2 origin-top transition-[transform,opacity] duration-500 motion-reduce:transition-none"
                            style={{
                              opacity: front ? 0 : 1,
                              transform: `perspective(900px) rotateY(${front ? -yaw / 2 : 0}deg)`,
                            }}
                          >
                            <Image
                              src={item.sideImage}
                              alt=""
                              width={600}
                              height={720}
                              priority={i < 5}
                              className="h-auto w-full drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]"
                            />
                          </span>
                        ) : null}
                        <span
                          className="absolute top-0 left-1/2 block w-(--w) -translate-x-1/2 origin-top transition-[transform,opacity] duration-500 motion-reduce:transition-none"
                          style={{
                            opacity: front || !item.sideImage ? 1 : 0,
                            transform: `perspective(900px) rotateY(${front ? 0 : yaw}deg)`,
                          }}
                        >
                          <Image
                            src={item.image}
                            alt={name(i)}
                            width={600}
                            height={720}
                            priority={i < 5}
                            className="h-auto w-full drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]"
                          />
                        </span>
                      </button>
                      <span
                        className="block"
                        style={{ height: "calc(var(--w) * 1.2)" }}
                        aria-hidden
                      />
                    </li>
                  );
                })}
              </ul>
            </div>

            <p
              className={`mt-14 h-5 text-center text-xs text-[#3d4670]/70 transition-opacity duration-300 md:mt-16 ${active === null ? "opacity-0" : "opacity-100"}`}
              aria-hidden
            >
              {active === null ? "" : `${name(active)} · ${price(bannerItems[active].priceUsd)}`}
            </p>
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
                width={600}
                height={720}
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
          <p className="text-sm text-[#3d4670]/70">
            {cat(open)} · {price(bannerItems[open].priceUsd)} ·{" "}
            {ar ? "تصميم تجريبي" : "Example design"}
          </p>
          <Link
            href={localizeHref(locale, `/collections/${bannerItems[open].category}`)}
            className={`mt-3 ${PILL}`}
          >
            {ar ? `تصفّح ${cat(open)}` : `Browse ${cat(open)}`}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
