import { MAX_CUSTOM_TEXT } from "./products";

export type TextCheck =
  | { ok: true; text: string }
  | { ok: false; reason: "abuse" | "chars" | "empty" | "link" | "long" };

const ARABIC_MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
const ALLOWED = /^[\p{Script=Arabic}\p{Script=Latin}\p{M}\p{N}\s.,!?:;'"()\-–—&+…،؛؟«»]+$/u;
const LINKISH =
  /(https?:|www\.|\.(com|net|org|io|co|ly|me|app)\b|@[a-z0-9_]{3,}|\+?\d[\d\s-]{8,})/i;

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
};

/** Word stems (matched anywhere in a word) that are abusive in any context. */
const EN_STEMS = [
  "fuck",
  "shit",
  "cunt",
  "nigg",
  "fagg",
  "whore",
  "bitch",
  "bastard",
  "asshole",
  "dickhead",
  "pussy",
  "slut",
  "wank",
  "twat",
  "retard",
  "rapist",
  "nazi",
  "hitler",
  "kkk",
  "jihad",
  "blowjob",
  "cocksuck",
  "motherf",
  "bullshit",
  "porn",
];
/** Whole words only, so "class" and "Dickens" stay legal. */
const EN_WORDS = new Set([
  "ass",
  "arse",
  "dick",
  "cock",
  "tits",
  "boob",
  "boobs",
  "rape",
  "kill",
  "isis",
  "cum",
  "fag",
  "hoe",
  "damn",
  "piss",
  "crap",
  "sex",
  "sexy",
  "nude",
  "naked",
  "terrorist",
  "negro",
]);
const AR_STEMS = [
  "شرموط",
  "منيوك",
  "منيك",
  "قحب",
  "عرص",
  "ابن الكلب",
  "ابن الحرام",
  "ابن الشرمو",
  "كسمك",
  "كسام",
  "كسها",
  "كسخت",
  "طيزك",
  "ينعل",
  "يلعن",
  "زبي",
  "زبك",
  "انيك",
  "نيك",
  "خرا",
  "ابن العاهر",
  "ديوث",
  "متناك",
  "لوطي",
  "شاذ جنس",
  "داعش",
  "كلب ابن",
];
const AR_WORDS = new Set([
  "كس",
  "زب",
  "طيز",
  "نيك",
  "خول",
  "عاهره",
  "عاهر",
  "زانيه",
  "جنس",
  "عير",
  "بزاز",
  "سكس",
  "فرج",
]);

export function normalizeForCheck(raw: string): string {
  let s = raw.normalize("NFKD").toLowerCase().replace(ARABIC_MARKS, "");
  s = s
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
  s = s.replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/[01345 7@$]/g, (c) => (c === " " ? c : (LEET[c] ?? c)));
  return s.replace(/(.)\1{2,}/g, "$1$1");
}

const SAFE_WORDS =
  /\b(scunthorpe|penistone|cockburn|dickens|dickinson|assistant|assess|class|classic|glass|grass|bass|mass|pass|passion|analysis|analyst)\b/g;
const collapse = (s: string) => s.replace(/(.)\1+/gu, "$1");

function containsAbuse(raw: string): boolean {
  const norm = normalizeForCheck(raw).replace(SAFE_WORDS, " ");
  const single = collapse(norm);
  for (const variant of [norm, single]) {
    const words = variant.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    for (const w of words) {
      if (EN_WORDS.has(w) || AR_WORDS.has(w)) return true;
      for (const stem of EN_STEMS)
        if (variant === norm ? w.includes(stem) : w.includes(collapse(stem))) return true;
    }
    const squashed = variant.replace(/[^\p{L}\p{N}]+/gu, "");
    for (const stem of AR_STEMS) {
      const s = variant === norm ? stem : collapse(stem);
      const bare = s.replace(/\s+/g, "");
      if (variant.includes(s) || squashed.includes(bare)) return true;
    }
    // Letters split by spaces or dots to dodge word checks: f u c k
    for (const stem of EN_STEMS) {
      const s = variant === norm ? stem : collapse(stem);
      if (s.length >= 4 && squashed.includes(s)) return true;
    }
  }
  return false;
}

/** Validates customer text for the design builder. Runs in the browser and again when the order arrives. */
export function checkCustomText(raw: string): TextCheck {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return { ok: false, reason: "empty" };
  if (text.length > MAX_CUSTOM_TEXT) return { ok: false, reason: "long" };
  if (!ALLOWED.test(text)) return { ok: false, reason: "chars" };
  if (LINKISH.test(text)) return { ok: false, reason: "link" };
  if (containsAbuse(text)) return { ok: false, reason: "abuse" };
  return { ok: true, text };
}
