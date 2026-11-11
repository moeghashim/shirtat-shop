import { createFileRoute, Outlet } from "@tanstack/react-router";

import { BrandLogo } from "@/components/brand/brand";
import { APP_CONFIG } from "@/config/app-config";

export const Route = createFileRoute("/(main)/auth/v2")({
  // Workers module clocks may start at the epoch. Serialize the real request's UTC year
  // so server and hydrating client share one value, independent of browser timezone.
  loader: () => ({ copyright: APP_CONFIG.copyright(new Date().getUTCFullYear()) }),
  component: Layout,
});

function Layout() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex min-w-0 flex-col">
        <Outlet />
      </div>
      <aside className="bg-muted m-2 hidden flex-col justify-between gap-12 rounded-xl p-10 lg:flex">
        <div className="space-y-3">
          <BrandLogo className="text-foreground h-16" />
          <p className="text-muted-foreground text-sm">Owner and designer dashboards.</p>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-2">
            <h2 className="font-medium">Invite only</h2>
            <p className="text-muted-foreground text-sm">The owner creates accounts. There is no public sign-up.</p>
          </div>
          <div className="space-y-2">
            <h2 className="font-medium">SEO plan</h2>
            <p className="text-muted-foreground text-sm">
              Search Console, the catalog and the sitemap load after you sign in.
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}
