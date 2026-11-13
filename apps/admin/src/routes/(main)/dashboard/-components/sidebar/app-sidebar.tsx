import { useEffect } from "react";

import { Link, useRouter } from "@tanstack/react-router";

import { BookOpen, CircleHelp, MessageCircle } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { BrandLogo } from "@/components/brand/brand";
import { SearchTrigger } from "@/components/navigation/search-trigger";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_LANDING_ROUTE } from "@/navigation/landing";
import { OWNER_ONLY_ITEMS, sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { LayoutControls } from "../header/layout-controls";
import { NavMain } from "./nav-main";
import { SupportCard } from "./support-card";

export function AppSidebar({
  authenticated = false,
  owner = false,
  ...props
}: React.ComponentProps<typeof Sidebar> & { authenticated?: boolean; owner?: boolean }) {
  const router = useRouter();
  const items = sidebarItems.map((group) => ({
    ...group,
    items: group.items.filter((item) => (owner ?? false) || !OWNER_ONLY_ITEMS.has(item.id)),
  }));
  const { setOpenMobile } = useSidebar();
  useEffect(() => router.subscribe("onResolved", () => setOpenMobile(false)), [router, setOpenMobile]);
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.values.sidebar_variant,
      sidebarCollapsible: s.values.sidebar_collapsible,
      isSynced: s.isSynced,
    })),
  );
  return (
    <Sidebar
      {...props}
      variant={isSynced ? sidebarVariant : props.variant}
      collapsible={isSynced ? sidebarCollapsible : props.collapsible}
    >
      <SidebarHeader className="shell-sidebar-header gap-4 p-4">
        <div className="flex items-center gap-2">
          <Link
            to={APP_LANDING_ROUTE}
            aria-label="Shirtat admin"
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg group-data-[collapsible=icon]:hidden"
          >
            <BrandLogo className="h-11" />
          </Link>
          <SidebarTrigger className="shrink-0" />
        </div>
        <SearchTrigger sidebar />
      </SidebarHeader>
      <SidebarContent className="gap-1 px-3">
        <nav aria-label="Main navigation">
          <NavMain items={items} />
        </nav>
      </SidebarContent>
      <SidebarFooter className="gap-3 p-3">
        <SupportCard authenticated={authenticated} />
        <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col">
          <LayoutControls sidebar />
          <div className="ml-auto flex group-data-[collapsible=icon]:hidden">
            {[
              { title: "Help", href: "https://shirtat.co", icon: CircleHelp },
              {
                title: "Documentation",
                href: "https://github.com/moeghashim/shirtat-shop/blob/main/apps/admin/README.md",
                icon: BookOpen,
              },
              { title: "Feedback", href: "https://github.com/moeghashim/shirtat-shop/issues/new", icon: MessageCircle },
            ].map(({ title, href, icon: Icon }) => (
              <Button
                key={title}
                nativeButton={false}
                variant="ghost"
                size="icon-sm"
                render={<a href={href} target="_blank" rel="noreferrer" />}
                aria-label={title}
                title={title}
              >
                <Icon />
              </Button>
            ))}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
