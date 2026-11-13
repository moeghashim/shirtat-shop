/** Owner admin lives at admin.shirtat.co. SHIRTAT_ADMIN_URL overrides the origin (e.g. a preview). */
export function adminAppUrl(): string {
  const value = process.env.SHIRTAT_ADMIN_URL?.trim();
  if (value) {
    try {
      const url = new URL(value);
      if ((url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password)
        return url.origin;
    } catch {
      // fall through to the production origin
    }
  }
  return "https://admin.shirtat.co";
}

/** Where each retired storefront /admin page now lives in the admin app. */
export const ADMIN_PAGE_MOVES = [
  { from: "/admin", to: "/dashboard/designers" },
  { from: "/admin/creators", to: "/dashboard/designers" },
  { from: "/admin/creators/:path*", to: "/dashboard/designers" },
  { from: "/admin/chats", to: "/dashboard/chats" },
  { from: "/admin/chats/:sessionId", to: "/dashboard/chats/:sessionId" },
  { from: "/admin/seo", to: "/dashboard/seo" },
  { from: "/admin/seo/:path*", to: "/dashboard/seo" },
  { from: "/admin/:path*", to: "/dashboard/designers" },
] as const;

/** Redirect rules for next.config: /admin/*, /en/admin/* and /ar/admin/* go to the admin app. */
export function adminRedirects(origin = adminAppUrl()) {
  return ["", "/en", "/ar"].flatMap((prefix) =>
    ADMIN_PAGE_MOVES.map((move) => ({
      destination: `${origin}${move.to}`,
      permanent: false,
      source: `${prefix}${move.from}`,
    })),
  );
}

export function adminDesignersUrl(): string {
  return `${adminAppUrl()}/dashboard/designers`;
}
