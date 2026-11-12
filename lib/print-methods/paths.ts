/** Path constants with no `@/` imports, so the admin app can read them through `lib/seo/paths`. */
export const PRINT_METHOD_INDEX_PATH = "/print-methods";

export const PRINT_METHOD_PAGE = {
  aop: "/print-methods/aop",
  dtf: "/print-methods/dtf",
  dtg: "/print-methods/dtg",
  embroidery: "/print-methods/embroidery",
} as const;

export const PRINT_METHOD_PATHS = [
  PRINT_METHOD_INDEX_PATH,
  PRINT_METHOD_PAGE.dtg,
  PRINT_METHOD_PAGE.dtf,
  PRINT_METHOD_PAGE.embroidery,
  PRINT_METHOD_PAGE.aop,
] as const;

export const PRINT_METHOD_LASTMOD = "2026-11-12";
