import {
  Amiri,
  Aref_Ruqaa,
  Cairo,
  Changa,
  El_Messiri,
  Harmattan,
  Katibeh,
  Lalezar,
  Mada,
  Markazi_Text,
  Marhey,
  Mirza,
  Noto_Kufi_Arabic,
  Noto_Naskh_Arabic,
  Noto_Nastaliq_Urdu,
  Playpen_Sans_Arabic,
  Rakkas,
  Reem_Kufi,
} from "next/font/google";

import type { FontKey } from "@/lib/custom/styles";

// next/font needs literal options, so these are written out in full.
const amiri = Amiri({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-amiri",
  weight: "700",
});
const arefRuqaa = Aref_Ruqaa({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-aref",
  weight: "700",
});
const cairo = Cairo({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-cairo",
  weight: "800",
});
const changa = Changa({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-changa",
  weight: "700",
});
const katibeh = Katibeh({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-katibeh",
  weight: "400",
});
const lalezar = Lalezar({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-lalezar",
  weight: "400",
});
const markazi = Markazi_Text({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-markazi",
  weight: "700",
});
const mirza = Mirza({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-mirza",
  weight: "700",
});
const naskh = Noto_Naskh_Arabic({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-naskh",
  weight: "700",
});
const nastaliq = Noto_Nastaliq_Urdu({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-nastaliq",
  weight: "600",
});
const rakkas = Rakkas({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-rakkas",
  weight: "400",
});
const reemKufi = Reem_Kufi({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-reem",
  weight: "700",
});

const elMessiri = El_Messiri({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-messiri",
  weight: "700",
});
const harmattan = Harmattan({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-harmattan",
  weight: "700",
});
const mada = Mada({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-mada",
  weight: "900",
});
const marhey = Marhey({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-marhey",
  weight: "700",
});
const notoKufi = Noto_Kufi_Arabic({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-kufi",
  weight: "700",
});
const playpen = Playpen_Sans_Arabic({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-playpen",
  weight: "300",
});

export const DESIGN_FONT_VARIABLES = [
  amiri,
  arefRuqaa,
  cairo,
  changa,
  elMessiri,
  harmattan,
  katibeh,
  lalezar,
  mada,
  markazi,
  marhey,
  mirza,
  naskh,
  nastaliq,
  notoKufi,
  playpen,
  rakkas,
  reemKufi,
]
  .map((f) => f.variable)
  .join(" ");

const FAMILY: Record<FontKey, string> = {
  amiri: amiri.style.fontFamily,
  arefRuqaa: arefRuqaa.style.fontFamily,
  elMessiri: elMessiri.style.fontFamily,
  harmattan: harmattan.style.fontFamily,
  mada: mada.style.fontFamily,
  marhey: marhey.style.fontFamily,
  notoKufi: notoKufi.style.fontFamily,
  playpen: playpen.style.fontFamily,
  cairo: cairo.style.fontFamily,
  changa: changa.style.fontFamily,
  katibeh: katibeh.style.fontFamily,
  lalezar: lalezar.style.fontFamily,
  markazi: markazi.style.fontFamily,
  mirza: mirza.style.fontFamily,
  naskh: naskh.style.fontFamily,
  nastaliq: nastaliq.style.fontFamily,
  rakkas: rakkas.style.fontFamily,
  reemKufi: reemKufi.style.fontFamily,
};

export function fontFamily(key: FontKey): string {
  return FAMILY[key];
}
