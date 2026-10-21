"use client";

import Image from "next/image";
import { type PointerEvent, useEffect, useRef, useState } from "react";

import type { BannerItem } from "@/lib/banner";

const SIDE_YAW = 70;
const SIDE_SLOT = 0.36;
const FRONT_SLOT = 0.82;
const STIFFNESS = 170;
const DAMPING = 21;
const SWAY_LIMIT = 5;
const ROD = "calc(var(--w) * 1.2 * 0.036)";

interface HeroRackProps {
  ar: boolean;
  items: BannerItem[];
  locked: boolean;
  onOpen: (index: number) => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const slotOrder = (ar: boolean, n: number, k: number) => (ar ? n - 1 - k : k);

export function HeroRack({ ar, items, locked, onOpen }: HeroRackProps) {
  const n = items.length;
  const [caption, setCaption] = useState<number | null>(null);
  const rack = useRef<HTMLUListElement>(null);
  const wakeRef = useRef<() => void>(() => {});
  const swings = useRef<(HTMLDivElement | null)[]>([]);
  const sides = useRef<(HTMLSpanElement | null)[]>([]);
  const fronts = useRef<(HTMLSpanElement | null)[]>([]);
  const anchors = useRef<(HTMLLIElement | null)[]>([]);
  const sim = useRef({
    centers: [] as number[],
    frame: 0,
    last: 0,
    openness: new Array<number>(n).fill(0),
    prevDelta: new Array<number>(n).fill(0),
    slots: [] as number[],
    sway: new Array<number>(n).fill(0),
    target: null as number | null,
    velocity: new Array<number>(n).fill(0),
  });
  const yaw = ar ? -SIDE_YAW : SIDE_YAW;
  const rackFactor = n * SIDE_SLOT + (FRONT_SLOT - SIDE_SLOT) + 0.7;
  const restPad = (FRONT_SLOT - SIDE_SLOT + 0.7) / 2;

  useEffect(() => {
    const s = sim.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const width = () => {
      const ul = rack.current;
      return ul ? Number.parseFloat(getComputedStyle(ul).getPropertyValue("--w")) || 230 : 230;
    };

    const render = (dt: number) => {
      const w = width();
      const total = s.openness.reduce(
        (sum, o) => sum + (SIDE_SLOT + (FRONT_SLOT - SIDE_SLOT) * clamp(o, 0, 1.04)) * w,
        0,
      );
      let x = (rackFactor * w - total) / 2;
      for (let k = 0; k < n; k++) {
        const i = slotOrder(ar, n, k);
        const o = clamp(s.openness[i], 0, 1.04);
        const slot = (SIDE_SLOT + (FRONT_SLOT - SIDE_SLOT) * o) * w;
        const center = x + slot / 2;
        const rest = (restPad + (k + 0.5) * SIDE_SLOT) * w;
        const delta = center - rest;
        s.centers[i] = center;
        s.slots[i] = slot;
        x += slot;

        const vx = dt > 0 ? (delta - s.prevDelta[i]) / dt : 0;
        s.prevDelta[i] = delta;
        s.sway[i] +=
          (clamp(-vx * 0.0055, -SWAY_LIMIT, SWAY_LIMIT) - s.sway[i]) * Math.min(1, dt * 10);

        const anchor = anchors.current[i];
        const swing = swings.current[i];
        const side = sides.current[i];
        const front = fronts.current[i];
        if (anchor) {
          anchor.style.transform = `translate3d(${delta.toFixed(2)}px,0,0)`;
          anchor.style.zIndex = String(Math.round(o * 10));
        }
        if (swing) swing.style.transform = `rotate(${s.sway[i].toFixed(3)}deg)`;
        const pose = clamp(o, 0, 1);
        if (front) {
          front.style.transform = `perspective(3200px) rotateY(${(yaw * (1 - pose)).toFixed(2)}deg) scale(${(1 + 0.02 * o).toFixed(4)})`;
          if (side) front.style.opacity = String(clamp(pose * 1.6 - 0.2, 0, 1));
        }
        if (side) {
          side.style.opacity = String(clamp(1 - pose * 1.6, 0, 1));
          side.style.transform = `perspective(3200px) rotateY(${((ar ? 1 : -1) * 35 * pose).toFixed(2)}deg)`;
        }
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - s.last) / 1000 || 0.016);
      s.last = now;
      let moving = false;
      for (let i = 0; i < n; i++) {
        const goal = s.target === i ? 1 : 0;
        if (reduce.matches) {
          s.openness[i] = goal;
          s.velocity[i] = 0;
        } else {
          const a = STIFFNESS * (goal - s.openness[i]) - DAMPING * s.velocity[i];
          s.velocity[i] += a * dt;
          s.openness[i] += s.velocity[i] * dt;
        }
        if (Math.abs(goal - s.openness[i]) > 0.0008 || Math.abs(s.velocity[i]) > 0.004)
          moving = true;
        else {
          s.openness[i] = goal;
          s.velocity[i] = 0;
        }
      }
      render(dt);
      if (moving || s.sway.some((v) => Math.abs(v) > 0.01)) s.frame = requestAnimationFrame(tick);
      else s.frame = 0;
    };

    const wake = () => {
      if (!s.frame) {
        s.last = performance.now();
        s.frame = requestAnimationFrame(tick);
      }
    };

    wakeRef.current = wake;
    render(0);
    window.addEventListener("resize", wake);
    return () => {
      window.removeEventListener("resize", wake);
      if (s.frame) cancelAnimationFrame(s.frame);
      s.frame = 0;
    };
  }, [ar, n, restPad, rackFactor, yaw]);

  const aim = (target: number | null) => {
    const s = sim.current;
    if (s.target === target) return;
    s.target = target;
    setCaption(target);
    wakeRef.current();
  };

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
    const found = hit(e.clientX);
    if (found !== null || sim.current.target === null) aim(found);
  };

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 z-0"
        style={{ top: `calc(${ROD} - 6px)` }}
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
        className="relative z-10 cursor-pointer touch-pan-x"
        style={{ height: "calc(var(--w) * 1.2)", width: `calc(var(--w) * ${rackFactor})` }}
        onClick={(e) => {
          const found = hit(e.clientX);
          if (found !== null) onOpen(found);
        }}
        onPointerLeave={() => aim(null)}
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
                className="absolute top-0 w-(--w) -translate-x-1/2 origin-[50%_2%] will-change-transform"
                style={{ left: 0 }}
              >
                {item.sideImage ? (
                  <span
                    ref={(el) => {
                      sides.current[i] = el;
                    }}
                    className="absolute inset-x-0 top-0 block origin-top"
                  >
                    <Image
                      src={item.sideImage}
                      alt=""
                      width={800}
                      height={960}
                      priority={i < 5}
                      className="h-auto w-full drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]"
                    />
                  </span>
                ) : null}
                <span
                  ref={(el) => {
                    fronts.current[i] = el;
                  }}
                  className="block origin-top"
                  style={{
                    opacity: item.sideImage ? 0 : 1,
                    transform: `perspective(3200px) rotateY(${yaw}deg)`,
                  }}
                >
                  <Image
                    src={item.image}
                    alt=""
                    width={800}
                    height={960}
                    priority={i < 5}
                    className="h-auto w-full drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]"
                  />
                </span>
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
                className="pointer-events-none absolute top-0 h-(--w) w-(--w) -translate-x-1/2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#3d4670]/60"
                style={{ height: "calc(var(--w) * 1.2)" }}
                aria-label={ar ? item.nameAr : item.nameEn}
              />
            </li>
          );
        })}
      </ul>

      <p
        className={`mt-14 h-5 text-center text-xs text-[#3d4670]/70 transition-opacity duration-300 md:mt-16 ${caption === null ? "opacity-0" : "opacity-100"}`}
        aria-hidden
      >
        {caption === null ? "" : ar ? items[caption].nameAr : items[caption].nameEn}
      </p>
    </div>
  );
}
