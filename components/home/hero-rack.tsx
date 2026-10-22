"use client";

import Image from "next/image";
import { type PointerEvent, type RefObject, useEffect, useRef, useState } from "react";

import type { BannerItem } from "@/lib/banner";

const REST_TURN = 64;
const SIDE_SLOT = 0.4;
const FRONT_SLOT = 0.82;
const LAYOUT_K = 102;
const LAYOUT_C = 19;
const SPIN_K = 62;
const SPIN_C = 7;
const PEND_W = 4.9;
const PEND_Z = 0.26;
const PEND_GAIN = 0.12;
const PEND_LIMIT = 9;
const STEP = 1 / 120;
const ROD_Y = 0.036;
const HOOK_W = 46;
const HOOK_H = 26;
const HOOK_AXIS = HOOK_W / 2;
const HOOK_ROD_Y = 9.9;
const HOOK_CURL = 7.5;
const HOOK_RISE = 7;

interface HeroRackProps {
  ar: boolean;
  items: BannerItem[];
  locked: boolean;
  onOpen: (index: number) => void;
  scroller: RefObject<HTMLDivElement | null>;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const ramp = (v: number, lo: number, hi: number) => {
  const t = clamp((v - lo) / (hi - lo), 0, 1);
  return t * t * (3 - 2 * t);
};
const slotOrder = (ar: boolean, n: number, k: number) => (ar ? n - 1 - k : k);

export function rackWidthFactor(n: number) {
  return n * SIDE_SLOT + (FRONT_SLOT - SIDE_SLOT) + 0.7;
}

function hookPath(openness: number) {
  const curl = HOOK_CURL * Math.sin((clamp(Math.abs(openness), 0, 90) * Math.PI) / 180);
  const x = HOOK_AXIS;
  return `M${x} ${HOOK_H} L${x} 21 C${x} 17 ${x + curl} 17 ${x + curl} 13 L${x + curl} ${HOOK_ROD_Y} A${curl.toFixed(2)} ${HOOK_RISE} 0 0 0 ${(x - curl).toFixed(2)} ${HOOK_ROD_Y} L${(x - curl).toFixed(2)} ${HOOK_ROD_Y + 3.4}`;
}

export function HeroRack({ ar, items, locked, onOpen, scroller }: HeroRackProps) {
  const n = items.length;
  const [caption, setCaption] = useState<number | null>(null);
  const rack = useRef<HTMLUListElement>(null);
  const wakeRef = useRef<() => void>(() => {});
  const swings = useRef<(HTMLDivElement | null)[]>([]);
  const sides = useRef<(HTMLSpanElement | null)[]>([]);
  const fronts = useRef<(HTMLSpanElement | null)[]>([]);
  const anchors = useRef<(HTMLLIElement | null)[]>([]);
  const hooks = useRef<(SVGGElement | null)[]>([]);
  const sim = useRef({
    alpha: new Array<number>(n).fill(0),
    alphaV: new Array<number>(n).fill(0),
    centers: [] as number[],
    frame: 0,
    last: 0,
    openness: new Array<number>(n).fill(0),
    opennessV: new Array<number>(n).fill(0),
    phi: new Array<number>(n).fill(REST_TURN),
    phiV: new Array<number>(n).fill(0),
    pointerT: 0,
    pointerVx: 0,
    pointerX: 0,
    prevDelta: new Array<number>(n).fill(0),
    prevVx: new Array<number>(n).fill(0),
    slots: [] as number[],
    target: null as number | null,
  });
  const dir = ar ? -1 : 1;
  const rackFactor = rackWidthFactor(n);
  const restPad = (FRONT_SLOT - SIDE_SLOT + 0.7) / 2;

  useEffect(() => {
    const s = sim.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const measure = () => {
      const ul = rack.current;
      return ul ? Number.parseFloat(getComputedStyle(ul).getPropertyValue("--w")) || 230 : 230;
    };
    let cached = measure();
    const width = () => cached;
    const lastHook = new Array<number>(n).fill(Number.NaN);
    const lastZ = new Array<number>(n).fill(Number.NaN);

    const layout = (w: number) => {
      const slots = s.openness.map(
        (o) => (SIDE_SLOT + (FRONT_SLOT - SIDE_SLOT) * clamp(o, 0, 1.04)) * w,
      );
      let x = (rackFactor * w - slots.reduce((a, b) => a + b, 0)) / 2;
      for (let k = 0; k < n; k++) {
        const i = slotOrder(ar, n, k);
        s.slots[i] = slots[i];
        s.centers[i] = x + slots[i] / 2;
        x += slots[i];
      }
      return (i: number) => s.centers[i] - (restPad + (slotOrder(ar, n, i) + 0.5) * SIDE_SLOT) * w;
    };

    const step = (h: number, w: number) => {
      const restDelta = layout(w);
      const arm = 0.9 * 1.2 * w;
      for (let i = 0; i < n; i++) {
        const open = s.target === i;
        const a = LAYOUT_K * ((open ? 1 : 0) - s.openness[i]) - LAYOUT_C * s.opennessV[i];
        s.opennessV[i] += a * h;
        s.openness[i] += s.opennessV[i] * h;
        const spin = SPIN_K * ((open ? 0 : REST_TURN) - s.phi[i]) - SPIN_C * s.phiV[i];
        s.phiV[i] += spin * h;
        s.phi[i] = clamp(s.phi[i] + s.phiV[i] * h, -34, 86);
      }
      layout(w);
      for (let i = 0; i < n; i++) {
        const delta = restDelta(i);
        const vx = (delta - s.prevDelta[i]) / h;
        const ax = (vx - s.prevVx[i]) / h;
        s.prevDelta[i] = delta;
        s.prevVx[i] = vx;
        const push = -((ax / arm) * 57.3 * PEND_GAIN);
        const pend = push - PEND_W * PEND_W * s.alpha[i] - 2 * PEND_Z * PEND_W * s.alphaV[i];
        s.alphaV[i] += pend * h;
        s.alpha[i] = clamp(s.alpha[i] + s.alphaV[i] * h, -PEND_LIMIT, PEND_LIMIT);
      }
    };

    const render = (w: number) => {
      const delta = layout(w);
      for (let i = 0; i < n; i++) {
        const o = clamp(s.openness[i], 0, 1.04);
        const phi = s.phi[i];
        const turn = Math.abs(phi);
        const anchor = anchors.current[i];
        const swing = swings.current[i];
        const side = sides.current[i];
        const front = fronts.current[i];
        const hook = hooks.current[i];
        if (anchor) {
          anchor.style.transform = `translate3d(${delta(i).toFixed(2)}px,0,0)`;
          const z = Math.round(o * 10);
          if (z !== lastZ[i]) {
            lastZ[i] = z;
            anchor.style.zIndex = String(z);
          }
        }
        if (swing) {
          const lag = clamp(-s.phiV[i] * dir * 0.03, -6, 6);
          swing.style.transform = `rotate(${s.alpha[i].toFixed(3)}deg) skewX(${lag.toFixed(3)}deg)`;
        }
        if (front) {
          front.style.transform = `perspective(2400px) rotateY(${(dir * phi).toFixed(2)}deg) scale(${(1 + 0.02 * o).toFixed(4)})`;
          if (side) front.style.opacity = String(1 - ramp(turn, 0.5 * REST_TURN, 1.05 * REST_TURN));
        }
        if (side) {
          side.style.opacity = String(ramp(turn, 0.05 * REST_TURN, 0.85 * REST_TURN));
          side.style.transform = `perspective(2400px) rotateY(${(dir * phi).toFixed(2)}deg)`;
        }
        if (hook && !(Math.abs(phi - lastHook[i]) < 0.3)) {
          lastHook[i] = phi;
          const d = hookPath(phi);
          for (const path of hook.children) path.setAttribute("d", d);
        }
      }
    };

    const tick = (now: number) => {
      const w = width();
      const dt = Math.min(1 / 30, (now - s.last) / 1000 || 1 / 60);
      s.last = now;
      if (reduce.matches) {
        for (let i = 0; i < n; i++) {
          const open = s.target === i;
          s.openness[i] = open ? 1 : 0;
          s.phi[i] = open ? 0 : REST_TURN;
          s.opennessV[i] = s.phiV[i] = s.alpha[i] = s.alphaV[i] = 0;
        }
        layout(w);
        render(w);
        s.frame = 0;
        return;
      }
      const steps = Math.max(1, Math.ceil(dt / STEP));
      for (let k = 0; k < steps; k++) step(dt / steps, w);
      render(w);
      let moving = false;
      for (let i = 0; i < n; i++) {
        const open = s.target === i;
        if (
          Math.abs((open ? 1 : 0) - s.openness[i]) > 0.001 ||
          Math.abs(s.opennessV[i]) > 0.01 ||
          Math.abs((open ? 0 : REST_TURN) - s.phi[i]) > 0.08 ||
          Math.abs(s.phiV[i]) > 0.4 ||
          Math.abs(s.alpha[i]) > 0.02 ||
          Math.abs(s.alphaV[i]) > 0.1
        )
          moving = true;
      }
      s.frame = moving ? requestAnimationFrame(tick) : 0;
    };

    const wake = () => {
      if (!s.frame) {
        s.last = performance.now();
        s.frame = requestAnimationFrame(tick);
      }
    };

    wakeRef.current = wake;
    const onResize = () => {
      cached = measure();
      wake();
    };
    layout(width());
    render(width());
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (s.frame) cancelAnimationFrame(s.frame);
      s.frame = 0;
    };
  }, [ar, n, restPad, rackFactor, dir]);

  const aim = (target: number | null, push = 0) => {
    const s = sim.current;
    if (s.target === target) return;
    const previous = s.target;
    s.target = target;
    const kick = clamp(push, -45, 45);
    if (target !== null) s.alphaV[target] += kick;
    if (previous !== null) s.alphaV[previous] += kick * 0.6;
    setCaption(target);
    wakeRef.current();
  };

  useEffect(() => {
    const el = scroller.current;
    const ul = rack.current;
    if (!el || !ul || !window.matchMedia("(hover: none)").matches) return;
    let frame = 0;
    let last = el.scrollLeft;
    const focus = () => {
      frame = 0;
      if (locked) return;
      const w = Number.parseFloat(getComputedStyle(ul).getPropertyValue("--w")) || 150;
      const x =
        el.getBoundingClientRect().left + el.clientWidth / 2 - ul.getBoundingClientRect().left;
      const rest = (i: number) => (restPad + (slotOrder(ar, n, i) + 0.5) * SIDE_SLOT) * w;
      let best = 0;
      for (let i = 1; i < n; i++) if (Math.abs(x - rest(i)) < Math.abs(x - rest(best))) best = i;
      const current = sim.current.target;
      const outside = Math.abs(x - rest(best)) > SIDE_SLOT * w * 1.2;
      const next = outside ? null : best;
      if (next === current) return;
      if (
        next !== null &&
        current !== null &&
        Math.abs(x - rest(next)) > Math.abs(x - rest(current)) - 0.1 * SIDE_SLOT * w
      )
        return;
      const velocity = el.scrollLeft - last;
      last = el.scrollLeft;
      aim(next, -velocity * 2.2);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(focus);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const boot = window.setTimeout(focus, 200);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.clearTimeout(boot);
      if (frame) cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ar, n, restPad, locked, scroller]);

  const hit = (clientX: number) => {
    const ul = rack.current;
    const s = sim.current;
    if (!ul || s.centers.length === 0) return null;
    const x = clientX - ul.getBoundingClientRect().left;
    for (let i = 0; i < n; i++) {
      if (Math.abs(x - s.centers[i]) <= s.slots[i] / 2) return i;
    }
    return null;
  };

  const move = (e: PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || locked) return;
    const s = sim.current;
    const now = performance.now();
    const dt = now - s.pointerT;
    if (dt > 0 && dt < 120)
      s.pointerVx = 0.6 * s.pointerVx + 0.4 * ((e.clientX - s.pointerX) / dt) * 1000;
    s.pointerT = now;
    s.pointerX = e.clientX;
    const found = hit(e.clientX);
    if (found !== null || s.target === null) aim(found, s.pointerVx * 0.012);
  };

  return (
    <>
      <div className="relative mx-6 sm:mx-24 md:mx-20">
        <div
          className="pointer-events-none absolute inset-x-0 z-0"
          style={{ top: `calc(var(--w) * 1.2 * ${ROD_Y} - 6px)` }}
          aria-hidden
        >
          <div className="absolute inset-x-1 top-[10px] h-2.5 rounded-[50%] bg-[#1f2430]/25 blur-[5px]" />
          <div
            className="relative h-3 rounded-[2px]"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, #565b62 0%, #aeb3ba 14%, #ffffff 32%, #e6e9ed 46%, #a3a9b0 64%, #62686f 86%, #8a9097 100%), linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 9%, rgba(255,255,255,0) 22%, rgba(255,255,255,0.25) 58%, rgba(255,255,255,0) 74%, rgba(255,255,255,0.4) 93%, rgba(255,255,255,0) 100%)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset, 0 1px 2px rgba(0,0,0,0.35)",
            }}
          />
          {["-start-6", "-end-6"].map((side) => (
            <div key={side} className={`absolute -top-[13px] ${side} h-[38px] w-[38px]`}>
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 34% 28%, #ffffff 0%, #d9dde2 38%, #9aa0a7 78%, #767c83 100%)",
                  boxShadow: "0 4px 7px rgba(20,24,40,0.4), 0 0 0 1px rgba(90,96,104,0.55) inset",
                }}
              />
              <div
                className="absolute inset-[9px] rounded-full"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 36% 30%, #f4f5f7 0%, #b8bdc3 60%, #8a9097 100%)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.35)",
                }}
              />
              <span className="absolute start-1/2 top-[3px] size-[3px] -translate-x-1/2 rounded-full bg-[#5d636a]" />
              <span className="absolute start-1/2 bottom-[3px] size-[3px] -translate-x-1/2 rounded-full bg-[#5d636a]" />
            </div>
          ))}
        </div>

        <ul
          ref={rack}
          className="relative z-10 cursor-pointer"
          style={{
            height: "calc(var(--w) * 1.2)",
            touchAction: "pan-x pan-y",
            width: `calc(var(--w) * ${rackFactor})`,
          }}
          onClick={(e) => {
            const found = hit(e.clientX);
            if (found !== null) onOpen(found);
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") aim(null);
          }}
          onPointerMove={move}
        >
          {items.map((item, i) => {
            const k = slotOrder(ar, n, i);
            return (
              <li
                key={item.slug}
                ref={(el) => {
                  anchors.current[i] = el;
                }}
                className="absolute top-0 w-0 will-change-transform"
                style={{ left: `calc(var(--w) * ${restPad + (k + 0.5) * SIDE_SLOT})` }}
              >
                <div
                  ref={(el) => {
                    swings.current[i] = el;
                  }}
                  className="absolute top-0 left-0 w-(--w) -translate-x-1/2 will-change-transform"
                  style={{ transformOrigin: `50% ${ROD_Y * 100}%` }}
                >
                  {item.sideImage ? (
                    <span
                      ref={(el) => {
                        sides.current[i] = el;
                      }}
                      className="absolute inset-x-0 top-0 block origin-top will-change-[transform,opacity]"
                      style={{ transform: `perspective(2400px) rotateY(${dir * REST_TURN}deg)` }}
                    >
                      <Image
                        src={item.sideImage}
                        alt=""
                        width={800}
                        height={960}
                        priority
                        className="h-auto w-full drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]"
                      />
                    </span>
                  ) : null}
                  <span
                    ref={(el) => {
                      fronts.current[i] = el;
                    }}
                    className="block origin-top will-change-[transform,opacity]"
                    style={{
                      opacity: item.sideImage ? 0 : 1,
                      transform: `perspective(2400px) rotateY(${dir * REST_TURN}deg)`,
                    }}
                  >
                    <Image
                      src={item.image}
                      alt=""
                      width={800}
                      height={960}
                      priority
                      className="h-auto w-full drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]"
                    />
                  </span>
                  <svg
                    viewBox={`0 0 ${HOOK_W} ${HOOK_H}`}
                    className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 overflow-visible drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]"
                    style={{ height: "calc(var(--w) * 0.115)", width: "calc(var(--w) * 0.2)" }}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <g
                      ref={(el) => {
                        hooks.current[i] = el;
                      }}
                    >
                      <path d={hookPath(REST_TURN)} stroke="#555b62" strokeWidth="2.1" />
                      <path d={hookPath(REST_TURN)} stroke="#eef1f4" strokeWidth="0.8" />
                    </g>
                    <rect
                      x="20.7"
                      y="22.4"
                      width="4.6"
                      height="3.8"
                      rx="1.1"
                      fill="#b9bec5"
                      stroke="#6c7279"
                      strokeWidth="0.5"
                    />
                  </svg>
                </div>
                <button
                  type="button"
                  onBlur={() => aim(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(i);
                  }}
                  onFocus={() => aim(i)}
                  tabIndex={locked ? -1 : 0}
                  className="pointer-events-none absolute top-0 left-0 w-(--w) -translate-x-1/2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#3d4670]/60"
                  style={{ height: "calc(var(--w) * 1.2)" }}
                  aria-label={ar ? item.nameAr : item.nameEn}
                />
              </li>
            );
          })}
        </ul>
      </div>
      <p
        className={`sticky left-0 mt-14 h-5 w-screen text-center text-xs text-[#3d4670]/70 transition-opacity duration-300 md:static md:mt-16 md:w-auto ${caption === null ? "opacity-0" : "opacity-100"}`}
        aria-hidden
      >
        {caption === null ? "" : ar ? items[caption].nameAr : items[caption].nameEn}
      </p>
    </>
  );
}
