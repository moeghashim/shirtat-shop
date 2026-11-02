import type { CustomKind } from "./products";

/**
 * Real Printify product photos for the /design preview, one per colour.
 * `rect` is the print area as [left, top, width, height] in percent of the square photo,
 * measured from Printify's own mockup of a full-area test print (see public/design/mockups).
 */
interface Mockup {
  /** Where the artwork may sit, as [left, top, width, height] percent of the photo. */
  art: [number, number, number, number];
  file: (color: string, size: string | undefined) => string;
}

const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

const MOCKUPS: Record<"hoodie" | "mug" | "tee" | "tee-women", Mockup> = {
  // Boxes are the measured print areas pulled in so the art sits like a real chest/mug print.
  hoodie: { art: [34.3, 29.8, 32.3, 20.5], file: (c) => `hoodie-${slug(c)}` },
  mug: {
    art: [14, 25, 40, 50],
    file: (_c, size) => (size === "15oz" ? "mug-15oz" : "mug-11oz"),
  },
  tee: { art: [32.4, 28.5, 36, 40], file: (c) => `tee-${slug(c)}` },
  "tee-women": { art: [36.6, 27.5, 26.5, 31], file: (c) => `tee-women-${slug(c)}` },
};

const COLORS: Record<string, readonly string[]> = {
  hoodie: ["Black", "Dark Chocolate", "Maroon", "Navy", "Sand", "Sport Grey", "White"],
  tee: [
    "Athletic Heather",
    "Black",
    "Maroon",
    "Natural",
    "Navy",
    "Olive",
    "Sand Dune",
    "Soft Cream",
    "White",
  ],
  "tee-women": ["Athletic Heather", "Black", "Maroon", "Natural", "Navy", "White"],
};

export interface ProductPhoto {
  alt: string;
  art: [number, number, number, number];
  src: string;
}

export function productPhoto(
  kind: CustomKind,
  options: { color?: string; fit?: string; size?: string },
): ProductPhoto {
  const key = kind === "tee" && options.fit === "Women's" ? "tee-women" : kind;
  const mockup = MOCKUPS[key];
  const known = COLORS[key];
  const color = options.color && known?.includes(options.color) ? options.color : "White";
  return {
    alt: "",
    art: mockup.art,
    src: `/design/mockups/${mockup.file(color, options.size)}.webp`,
  };
}
