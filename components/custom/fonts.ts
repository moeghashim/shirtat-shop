import {
  Amiri,
  Aref_Ruqaa,
  Cairo,
  Changa,
  Katibeh,
  Kufam,
  Lalezar,
  Lateef,
  Markazi_Text,
  Mirza,
  Noto_Naskh_Arabic,
  Noto_Nastaliq_Urdu,
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
const kufam = Kufam({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-kufam",
  weight: "700",
});
const lalezar = Lalezar({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-lalezar",
  weight: "400",
});
const lateef = Lateef({
  display: "swap",
  preload: false,
  subsets: ["arabic", "latin"],
  variable: "--font-d-lateef",
  weight: "600",
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

export const DESIGN_FONT_VARIABLES = [
  amiri,
  arefRuqaa,
  cairo,
  changa,
  katibeh,
  kufam,
  lalezar,
  lateef,
  markazi,
  mirza,
  naskh,
  nastaliq,
  rakkas,
  reemKufi,
]
  .map((f) => f.variable)
  .join(" ");

const FAMILY: Record<FontKey, string> = {
  amiri: amiri.style.fontFamily,
  arefRuqaa: arefRuqaa.style.fontFamily,
  cairo: cairo.style.fontFamily,
  changa: changa.style.fontFamily,
  katibeh: katibeh.style.fontFamily,
  kufam: kufam.style.fontFamily,
  lalezar: lalezar.style.fontFamily,
  lateef: lateef.style.fontFamily,
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
