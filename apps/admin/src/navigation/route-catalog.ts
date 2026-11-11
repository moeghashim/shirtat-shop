import { sidebarItems } from "./sidebar/sidebar-items.ts";

export const captureRoutes = [
  { route: "/", path: "/", ready: "SEO plan" },
  { route: "/dashboard", path: "/dashboard", ready: "SEO plan" },
  { route: "/dashboard/", path: "/dashboard/", ready: "SEO plan" },
  { route: "/dashboard/seo", path: "/dashboard/seo", ready: "SEO plan" },
  { route: "/dashboard/designers", path: "/dashboard/designers", ready: "Designers" },
  { route: "/dashboard/profile", path: "/dashboard/profile", ready: "Profile" },
  { route: "/dashboard/kit/", path: "/dashboard/kit", ready: "Blocks kit" },
  { route: "/auth/v2", path: "/auth/v2" },
  { route: "/auth/v2/login", path: "/auth/v2/login", ready: "Login to your account" },
  { route: "/unauthorized", path: "/unauthorized", ready: "Unauthorized Access" },
] as const satisfies readonly { route: string; path: string; ready?: string; status?: number }[];

const navRoutes = sidebarItems.flatMap((group) =>
  group.items.flatMap((item) =>
    (item.subItems ?? [item]).map((link) => ({ ...link, group: group.label ?? "Pages", icon: link.icon ?? item.icon })),
  ),
);
const extraLabels: Record<string, string> = {
  "/": "SEO",
  "/dashboard": "SEO",
  "/dashboard/": "SEO",
  "/auth/v2": "Authentication layout",
  "/auth/v2/login": "Login",
  "/unauthorized": "Unauthorized",
  "/dashboard/$": "Page not found",
};

export const routeCatalog = captureRoutes.map((entry) => {
  const nav = navRoutes.find((item) => item.url === entry.route.replace(/\/$/, ""));
  return {
    ...entry,
    label: extraLabels[entry.route] ?? nav?.title ?? entry.route,
    group: nav?.group ?? "Other screens",
    icon: nav?.icon,
  };
});

export function projectRouteTitle(path: string) {
  if (!path.startsWith("/dashboard/projects/")) return undefined;
  return undefined;
}
