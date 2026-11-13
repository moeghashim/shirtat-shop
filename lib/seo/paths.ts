// Relative so the admin app (which maps @/ to its own src) can import this file too.
import { GUIDE_PATHS } from "../guides/copy";

/** English and Arabic, the same pair `lib/i18n` publishes. */
export const SITEMAP_LOCALES = ["en", "ar"] as const;

export const SITEMAP_STATIC_PATHS = [
  "/",
  "/collections",
  "/creators",
  "/design",
  "/designers",
  "/making-of",
  "/roadmap",
  "/sales",
  ...GUIDE_PATHS,
] as const;

export const GUIDE_LASTMOD = "2026-11-11";
