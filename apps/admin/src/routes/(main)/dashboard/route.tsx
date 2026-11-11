import "./-components/sidebar/shell-sidebar.css";

import type { CSSProperties } from "react";

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { cn } from "cn";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireAppRoute } from "@/lib/auth/app-route";
import { isOwner } from "@/lib/auth/roles";
import { useSessionRefresh } from "@/lib/auth/use-session-refresh";
import { getDashboardLayout } from "@/server/server-actions";

import { ShellHeader } from "./-components/header/shell-header";
import { AppSidebar } from "./-components/sidebar/app-sidebar";

const getAccounts = createServerFn({ method: "GET" }).handler(async () => {
  const { requireSession } = await import("@/lib/auth/session.server");
  await requireSession();
  const { readAccounts } = await import("@/server/data/accounts");
  return readAccounts();
});

export const Route = createFileRoute("/(main)/dashboard")({
  beforeLoad: async ({ location, matches }) => {
    if (matches.at(-1)?.routeId === "/(main)/dashboard/$") return { app: null };
    return { app: await requireAppRoute({ location }) };
  },
  loader: async ({ context }) => {
    if (!context.app) return null;
    const { auth } = context.app;
    const layout = await getDashboardLayout();
    const identity =
      auth.mode === "auth" && auth.user
        ? { mode: "auth" as const, user: auth.user }
        : { mode: "demo" as const, accounts: await getAccounts() };
    const owner = identity.mode === "demo" || isOwner(identity.user);
    return { ...layout, identity, owner };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const data = Route.useLoaderData();
  useSessionRefresh(data?.identity.mode === "auth");
  if (!data) return <Outlet />;
  const { defaultOpen, variant, collapsible, identity } = data;

  return (
    <SidebarProvider
      className="tenboards-shell"
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width": "18rem",
          "--sidebar-width-icon": "4.5rem",
        } as CSSProperties
      }
    >
      <AppSidebar
        authenticated={identity.mode === "auth"}
        owner={data.owner}
        variant={variant}
        collapsible={collapsible}
      />
      <SidebarInset
        className={cn(
          "[html[data-content-layout=centered]_&>*]:mx-auto",
          "[html[data-content-layout=centered]_&>*]:w-full",
          "[html[data-content-layout=centered]_&>*]:max-w-screen-2xl",
          "peer-data-[variant=inset]:border",
          "[--dashboard-header-height:var(--shell-header-height)]",
          "min-w-0 overflow-x-clip",
        )}
      >
        <ShellHeader identity={identity} />
        {/* Pages can set data-content-padding="false" to render full-bleed app layouts. */}
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 has-data-[content-padding=false]:p-0 md:p-6 md:has-data-[content-padding=false]:p-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
