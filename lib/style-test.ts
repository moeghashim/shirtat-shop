// STYLE TEST ONLY (branch style-test, never merge): editorial on-model photos served from /public/style-test/<handle>.jpg.
import type { Image } from "@/lib/media/types";

const DESIGNS = ["al-adab", "al-hubb-wal-salam", "al-kiram-qaleel", "al-zulm", "la-ghina-kal-aql", "lahez-kalamak-garh", "sa-ateer-yawman", "tafakkar"];
const TYPES = ["t-shirt", "hoodie", "sweatshirt", "tote-bag", "print"];
const STYLE_TEST = new Set<string>([
  ...DESIGNS.flatMap((d) => TYPES.map((t) => `${d}-${t}`)),
  "tafakkar-cap",
  "tafakkar-beanie",
  "al-adab-cap",
  "al-adab-beanie",
]);

const LIFESTYLE_FILE = /\/lifestyle-[^/?]+\.jpg/;

/** Replace the shop's on-model photo with the style-test shot, or add one right after the first image. */
export function withStyleTest(handle: string, title: string, images: Image[]): Image[] {
  if (!STYLE_TEST.has(handle)) return images;
  const shot: Image = { altText: `AI-generated model wearing ${title}`, height: 1152, url: `/style-test/${handle}.jpg`, width: 864 };
  const i = images.findIndex((img) => LIFESTYLE_FILE.test(img.url));
  if (i >= 0) return images.map((img, j) => (j === i ? { ...shot, altText: img.altText || shot.altText } : img));
  return images.length ? [images[0]!, shot, ...images.slice(1)] : [shot];
}
