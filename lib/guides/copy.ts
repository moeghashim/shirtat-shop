import { GIFT_GUIDE } from "./gift";
import { INTENT_GUIDES } from "./intents";
import { PHRASE_GUIDES } from "./phrases";
import { SCRIPT_GUIDES } from "./scripts";
import type { Guide } from "./types";

export const GUIDES: readonly Guide[] = [
  GIFT_GUIDE,
  ...PHRASE_GUIDES,
  ...SCRIPT_GUIDES,
  ...INTENT_GUIDES,
];

export const GUIDE_PATHS: readonly string[] = GUIDES.map((guide) => guide.path);

const BY_PATH = new Map(GUIDES.map((guide) => [guide.path, guide]));

export function getGuide(path: string): Guide | undefined {
  return BY_PATH.get(path);
}

export function phraseGuide(slug: string): Guide | undefined {
  return getGuide(`/glossary/${slug}`);
}

export function scriptGuide(slug: string): Guide | undefined {
  return getGuide(`/scripts/${slug}`);
}

export const PHRASE_SLUGS = PHRASE_GUIDES.filter((guide) => guide.path !== "/glossary").map(
  (guide) => guide.path.slice("/glossary/".length),
);

export const SCRIPT_SLUGS = SCRIPT_GUIDES.filter((guide) => guide.path !== "/scripts").map(
  (guide) => guide.path.slice("/scripts/".length),
);
