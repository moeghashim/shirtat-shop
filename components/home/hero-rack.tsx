"use client";

import Image from "next/image";
import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from "react";

import type { BannerItem } from "@/lib/banner";

const REST_TURN = 64;
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
const CHROME_TUBE =
  "linear-gradient(to bottom, #2a2d31 0%, #6c7178 8%, #f4f6f8 20%, #ffffff 26%, #c4c9cf 36%, #7c828a 46%, #2f3236 54%, #5a5f66 60%, #b9bec5 70%, #eef0f2 80%, #aab0b7 90%, #3b3e43 100%)";
const CHROME_SMEAR =
  "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.28) 6%, rgba(255,255,255,0) 14%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.38) 38%, rgba(0,0,0,0.5) 47%, rgba(0,0,0,0.28) 56%, rgba(0,0,0,0) 64%, rgba(255,255,255,0.22) 82%, rgba(255,255,255,0) 90%, rgba(255,255,255,0.3) 97%, rgba(255,255,255,0) 100%)";

interface Geometry {
  pad: number;
  rack: number;
  slot: number;
  w: number;
}

interface HeroRackProps {
  ar: boolean;
  items: BannerItem[];
  locked: boolean;
  onOpen: (index: number) => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const ramp = (v: number, lo: number, hi: number) => {
  const t = clamp((v - lo) / (hi - lo), 0, 1);
  return t * t * (3 - 2 * t);
};
const slotOrder = (ar: boolean, n: number, k: number) => (ar ? n - 1 - k : k);

function hookPath(openness: number) {
  const curl = HOOK_CURL * Math.sin((clamp(Math.abs(openness), 0, 90) * Math.PI) / 180);
  const x = HOOK_AXIS;
  return `M${x} ${HOOK_H} L${x} 21 C${x} 17 ${x + curl} 17 ${x + curl} 13 L${x + curl} ${HOOK_ROD_Y} A${curl.toFixed(2)} ${HOOK_RISE} 0 0 0 ${(x - curl).toFixed(2)} ${HOOK_ROD_Y} L${(x - curl).toFixed(2)} ${HOOK_ROD_Y + 3.4}`;
}

export function HeroRack({ ar, items, locked, onOpen }: HeroRackProps) {
  const n = items.length;
  const [caption, setCaption] = useState<number | null>(null);
  const [coarse, setCoarse] = useState(false);
  const touch = useRef({ dragged: false, startX: 0 });
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

  useEffect(() => {
    const s = sim.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const measure = (): Geometry => {
      const ul = rack.current;
      const css = ul ? getComputedStyle(ul) : null;
      const read = (name: string, fallback: number) =>
        css ? Number.parseFloat(css.getPropertyValue(name)) || fallback : fallback;
      const slot = read("--slot", 0.4);
      const pad = read("--pad", 0.7);
      const rackFactor = n * slot + (FRONT_SLOT - slot) + pad;
      return { pad, rack: rackFactor, slot, w: ul ? ul.offsetWidth / rackFactor : 253 };
    };
    let cached = measure();
    const width = () => cached;
    const lastHook = new Array<number>(n).fill(Number.NaN);
    const lastZ = new Array<number>(n).fill(Number.NaN);

    const layout = ({ pad, rack: rackFactor, slot: side, w }: Geometry) => {
      const restPad = (FRONT_SLOT - side + pad) / 2;
      const slots = s.openness.map((o) => (side + (FRONT_SLOT - side) * clamp(o, 0, 1.04)) * w);
      let x = (rackFactor * w - slots.reduce((a, b) => a + b, 0)) / 2;
      for (let k = 0; k < n; k++) {
        const i = slotOrder(ar, n, k);
        s.slots[i] = slots[i];
        s.centers[i] = x + slots[i] / 2;
        x += slots[i];
      }
      return (i: number) => s.centers[i] - (restPad + (slotOrder(ar, n, i) + 0.5) * side) * w;
    };

    const step = (h: number, g: Geometry) => {
      const restDelta = layout(g);
      const arm = 0.9 * 1.2 * g.w;
      for (let i = 0; i < n; i++) {
        const open = s.target === i;
        const a = LAYOUT_K * ((open ? 1 : 0) - s.openness[i]) - LAYOUT_C * s.opennessV[i];
        s.opennessV[i] += a * h;
        s.openness[i] += s.opennessV[i] * h;
        const spin = SPIN_K * ((open ? 0 : REST_TURN) - s.phi[i]) - SPIN_C * s.phiV[i];
        s.phiV[i] += spin * h;
        s.phi[i] = clamp(s.phi[i] + s.phiV[i] * h, -34, 86);
      }
      layout(g);
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

    const render = (g: Geometry) => {
      const delta = layout(g);
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
      const g = width();
      const dt = Math.min(1 / 30, (now - s.last) / 1000 || 1 / 60);
      s.last = now;
      if (reduce.matches) {
        for (let i = 0; i < n; i++) {
          const open = s.target === i;
          s.openness[i] = open ? 1 : 0;
          s.phi[i] = open ? 0 : REST_TURN;
          s.opennessV[i] = s.phiV[i] = s.alpha[i] = s.alphaV[i] = 0;
        }
        layout(g);
        render(g);
        s.frame = 0;
        return;
      }
      const steps = Math.max(1, Math.ceil(dt / STEP));
      for (let k = 0; k < steps; k++) step(dt / steps, g);
      render(g);
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
  }, [ar, n, dir]);

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
    const query = window.matchMedia("(hover: none)");
    const sync = () => setCoarse(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

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
    if (locked) return;
    const s = sim.current;
    if (e.pointerType !== "mouse" && Math.abs(e.clientX - touch.current.startX) > 8) {
      touch.current.dragged = true;
    }
    const now = performance.now();
    const dt = now - s.pointerT;
    if (dt > 0 && dt < 120)
      s.pointerVx = 0.6 * s.pointerVx + 0.4 * ((e.clientX - s.pointerX) / dt) * 1000;
    s.pointerT = now;
    s.pointerX = e.clientX;
    const found = hit(e.clientX);
    if (found !== null || s.target === null) aim(found, s.pointerVx * 0.012);
  };

  const press = (e: PointerEvent<HTMLUListElement>) => {
    touch.current = { dragged: false, startX: e.clientX };
    if (e.pointerType === "mouse" || locked) return;
    const s = sim.current;
    s.pointerT = performance.now();
    s.pointerX = e.clientX;
    s.pointerVx = 0;
    const found = hit(e.clientX);
    if (found !== null) aim(found);
  };

  return (
    <>
      <div
        className="relative mx-8 [--pad:0.25] [--slot:0.32] [--w:clamp(64px,calc((100vw-64px)/var(--rack)),160px)] md:mx-20 md:[--pad:0.7] md:[--slot:0.4] md:[--w:clamp(120px,calc((100vw-160px)/var(--rack)),253px)]"
        style={
          {
            "--n": n,
            "--rack": "calc(var(--n) * var(--slot) + 0.82 - var(--slot) + var(--pad))",
            "--rod": "max(6px, calc(var(--w) * 0.05))",
          } as CSSProperties
        }
      >
        <div
          className="pointer-events-none absolute inset-x-0 z-0"
          style={{ top: `calc(var(--w) * 1.2 * ${ROD_Y} - var(--rod) / 2)` }}
          aria-hidden
        >
          <div
            className="absolute inset-x-2 rounded-[50%] bg-[#1f2430]/30 blur-[5px]"
            style={{ height: "calc(var(--rod) * 0.8)", top: "calc(var(--rod) * 0.95)" }}
          />
          <div
            className="relative"
            style={{
              backgroundImage: `${CHROME_SMEAR}, ${CHROME_TUBE}`,
              borderRadius: "calc(var(--rod) * 0.08)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
              height: "var(--rod)",
            }}
          >
            <div
              className="absolute inset-x-0"
              style={{
                backgroundImage:
                  "linear-gradient(to right, transparent, rgba(255,255,255,0.95) 7%, rgba(255,255,255,0.95) 93%, transparent)",
                height: "max(1px, calc(var(--rod) * 0.07))",
                top: "calc(var(--rod) * 0.2)",
              }}
            />
          </div>
          {(["left", "right"] as const).map((side) => (
            <div key={side}>
              <div
                className="absolute"
                style={{
                  [side]: "calc(var(--rod) * -1.75)",
                  backgroundImage: "linear-gradient(135deg, #f6f7f9, #c6cace 55%, #9fa4ab)",
                  borderRadius: "calc(var(--rod) * 0.14)",
                  boxShadow: "0 2px 4px rgba(20,24,40,0.35), 0 0 0 1px rgba(110,116,124,0.7) inset",
                  height: "calc(var(--rod) * 3.7)",
                  top: "calc(var(--rod) * -1.35)",
                  width: "calc(var(--rod) * 1.55)",
                }}
              >
                {(["top", "bottom"] as const).map((edge) => (
                  <span
                    key={edge}
                    className="absolute left-1/2 -translate-x-1/2 rounded-full"
                    style={{
                      [edge]: "calc(var(--rod) * 0.3)",
                      backgroundImage: "radial-gradient(circle at 35% 30%, #e9ebee, #7d838a)",
                      height: "calc(var(--rod) * 0.34)",
                      width: "calc(var(--rod) * 0.34)",
                    }}
                  />
                ))}
              </div>
              <div
                className="absolute"
                style={{
                  [side]: "calc(var(--rod) * -0.3)",
                  backgroundImage: `repeating-linear-gradient(to right, rgba(0,0,0,0.22) 0 1px, transparent 1px calc(var(--rod) * 0.28)), ${CHROME_TUBE}`,
                  borderRadius: "calc(var(--rod) * 0.12)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                  height: "calc(var(--rod) * 1.4)",
                  top: "calc(var(--rod) * -0.2)",
                  width: "calc(var(--rod) * 1.1)",
                }}
              />
            </div>
          ))}
        </div>

        <ul
          ref={rack}
          className="relative z-10 cursor-pointer"
          style={{
            height: "calc(var(--w) * 1.2)",
            touchAction: "pan-y",
            width: "calc(var(--w) * var(--rack))",
          }}
          onClick={(e) => {
            if (touch.current.dragged) {
              touch.current.dragged = false;
              return;
            }
            const found = hit(e.clientX);
            if (found !== null) onOpen(found);
          }}
          onPointerDown={press}
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
                style={{
                  left: `calc(var(--w) * ((0.82 - var(--slot) + var(--pad)) / 2 + ${k + 0.5} * var(--slot)))`,
                }}
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
                        sizes="(min-width: 768px) 253px, 160px"
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
                      priority={!item.sideImage}
                      sizes="(min-width: 768px) 253px, 160px"
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
        {caption === null
          ? ""
          : `${ar ? items[caption].nameAr : items[caption].nameEn}${coarse ? ` · ${ar ? "اضغط للعرض" : "Tap to view"}` : ""}`}
      </p>
    </>
  );
}
