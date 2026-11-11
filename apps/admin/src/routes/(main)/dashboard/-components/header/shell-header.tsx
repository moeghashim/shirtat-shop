import { useLayoutEffect, useRef } from "react";

import { Link, useRouterState } from "@tanstack/react-router";

import { cn } from "cn";

import { BrandMark } from "@/components/brand/brand";
import { SearchTrigger } from "@/components/navigation/search-trigger";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import type { DemoAccount } from "@/data/users";
import type { AuthState } from "@/lib/auth/types";
import { APP_LANDING_ROUTE } from "@/navigation/landing";
import { routeCatalog } from "@/navigation/route-catalog";

import { AccountSwitcher } from "./account-switcher";
import { GitHubRepositoriesMenu } from "./github-repositories-menu";
import { LayoutControls } from "./layout-controls";
import { SignedInAccount } from "./signed-in-account";

type ShellIdentity = { mode: "demo"; accounts: DemoAccount[] } | { mode: "auth"; user: NonNullable<AuthState["user"]> };

export function ShellHeader({ identity }: { identity: ShellIdentity }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const title = routeCatalog.find((item) => item.path === path)?.label ?? "Page not found";
  const { open, isMobile } = useSidebar();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const toggleHadFocus = useRef(false);

  useLayoutEffect(() => {
    const toggle = toggleRef.current;
    // Reopening off-canvas navigation or crossing the desktop breakpoint can
    // hide the focused opener. Hand focus to the sidebar's own control.
    if (!isMobile && toggleHadFocus.current && toggle && (open || !toggle.getClientRects().length)) {
      toggle
        .closest('[data-slot="sidebar-wrapper"]')
        ?.querySelector<HTMLButtonElement>('[data-slot="sidebar"] [data-slot="sidebar-trigger"]')
        ?.focus({ preventScroll: true });
      toggleHadFocus.current = false;
    }
  }, [open, isMobile]);

  return (
    <header className="bg-background flex h-(--shell-header-height) shrink-0 items-center gap-3 border-b px-4 md:px-6 [html[data-navbar-style=sticky]_&]:sticky [html[data-navbar-style=sticky]_&]:top-0 [html[data-navbar-style=sticky]_&]:z-20">
      <SidebarTrigger
        ref={toggleRef}
        className={cn("shell-header-sidebar-trigger shrink-0", open && "md:hidden")}
        onFocus={() => {
          toggleHadFocus.current = true;
        }}
        onBlur={() => {
          if (toggleRef.current?.getClientRects().length) toggleHadFocus.current = false;
        }}
      />
      <Link to={APP_LANDING_ROUTE} aria-label="Shirtat" className="text-foreground shrink-0 rounded-md">
        <BrandMark className="h-6" />
      </Link>
      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        <span className="text-muted-foreground hidden shrink-0 sm:inline">Workspace</span>
        <span className="text-muted-foreground hidden sm:inline" aria-hidden="true">
          /
        </span>
        <span className="truncate font-medium" title={title}>
          {title}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <div className="md:hidden">
          <SearchTrigger compact />
        </div>
        <ThemeSwitcher />
        <LayoutControls />
        <div className="hidden sm:block">
          <GitHubRepositoriesMenu />
        </div>
        {identity.mode === "demo" ? (
          <AccountSwitcher users={identity.accounts} />
        ) : (
          <SignedInAccount user={identity.user} />
        )}
      </div>
    </header>
  );
}
