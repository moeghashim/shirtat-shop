import { resolveBrowseParams } from "@/lib/collections";
import type { Locale } from "@/lib/i18n";

export interface DesignerCredit {
  handle: string;
  name: string;
  nameAr?: string;
}

/** Shirtat's in-house studio, credited when a product has no resolvable designer. */
export const SHIRTAT_DESIGNER: DesignerCredit = {
  handle: "shirtat",
  name: "Shirtat",
  nameAr: "شِرتات",
};

/** Square Shirtat mark used when a designer has no logo of their own. */
export const SHIRTAT_DESIGNER_LOGO = "/android-chrome-512x512.png";

const DESIGNER_PREFIX = "designer:";
const CREATOR_PREFIX = "creator:";
const HANDLE = /^[a-z0-9-]+$/;

export function isPublicDesigner(creator: {
  handle: string | null;
  hiddenFromDirectory?: boolean;
  status: string;
}): boolean {
  return (
    creator.status === "approved" &&
    Boolean(creator.handle) &&
    creator.handle !== SHIRTAT_DESIGNER.handle &&
    !creator.hiddenFromDirectory
  );
}

/** Display name the designer pages use: the submitted name, otherwise the account name. */
export function designerDisplayName(creator: {
  details?: { displayName?: string };
  name: string;
}): string {
  return creator.details?.displayName || creator.name;
}

export function publicDesignerCredits(
  creators: readonly {
    details?: { displayName?: string };
    handle: string | null;
    hiddenFromDirectory?: boolean;
    name: string;
    status: string;
  }[],
): DesignerCredit[] {
  const credits: DesignerCredit[] = [];
  for (const creator of creators) {
    if (!isPublicDesigner(creator) || !creator.handle) continue;
    credits.push({ handle: creator.handle, name: designerDisplayName(creator) });
  }
  return credits;
}

/** `designer:<handle>` wins over the legacy `creator:<handle>` tag. */
export function designerHandleFromTags(tags: readonly string[]): string | undefined {
  let legacy: string | undefined;
  for (const tag of tags) {
    const value = tag.trim().toLowerCase();
    if (value.startsWith(DESIGNER_PREFIX)) {
      const handle = value.slice(DESIGNER_PREFIX.length);
      if (HANDLE.test(handle)) return handle;
      continue;
    }
    if (legacy || !value.startsWith(CREATOR_PREFIX)) continue;
    const handle = value.slice(CREATOR_PREFIX.length);
    if (HANDLE.test(handle)) legacy = handle;
  }
  return legacy;
}

export function designerCopy(
  designer: { bio: string; bioAr?: string; name: string; nameAr?: string },
  locale: Locale,
): { bio: string; name: string } {
  if (locale !== "ar") return { bio: designer.bio, name: designer.name };
  return {
    bio: designer.bioAr || designer.bio,
    name: designer.nameAr || designer.name,
  };
}

/** Storefront search query for products tagged to this designer, including the legacy creator tag. */
export function designerProductQuery(handle: string): string | null {
  const normalized = handle.trim().toLowerCase();
  if (!HANDLE.test(normalized)) return null;
  return `tag:"designer:${normalized}" OR tag:"creator:${normalized}"`;
}

const DESIGNER_PATH = /^\/designers\/([^/]+)\/?$/;
const REFINED_DESIGNER_PATH = /^\/designers\/[^/]+\/refine\/?$/;

// Filtered and sorted designer catalogs render from the request-time refine route, same as collections.
export function getRefinedDesignerPath(pathname: string, search: string): string | null {
  const handle = DESIGNER_PATH.exec(pathname)?.[1];
  if (!handle || !resolveBrowseParams(search).dataSearch) return null;
  return `/designers/${handle}/refine`;
}

export function isRefinedDesignerPath(pathname: string): boolean {
  return REFINED_DESIGNER_PATH.test(pathname);
}

/** Public designer for a product's tags, or the Shirtat studio when the tag is missing or unknown. */
export function resolveDesignerCredit(
  tags: readonly string[],
  designers: readonly DesignerCredit[],
): DesignerCredit {
  const handle = designerHandleFromTags(tags);
  if (!handle || handle === SHIRTAT_DESIGNER.handle) return SHIRTAT_DESIGNER;
  return designers.find((designer) => designer.handle === handle) ?? SHIRTAT_DESIGNER;
}
