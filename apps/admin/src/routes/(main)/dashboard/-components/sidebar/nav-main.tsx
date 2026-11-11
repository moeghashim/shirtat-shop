import { useState } from "react";

import { Link, useRouterState } from "@tanstack/react-router";

import { cn } from "cn";
import { ChevronRight } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type {
  AppPath,
  NavBadge,
  NavGroup,
  NavMainItem,
  NavMainLinkItem,
  NavMainParentItem,
} from "@/navigation/sidebar/sidebar-items";

interface NavMainProps {
  readonly items: readonly NavGroup[];
}

interface NavItemProps {
  readonly item: NavMainItem;
  readonly isItemActive: (item: NavMainItem) => boolean;
  readonly isSubItemActive: (url: AppPath) => boolean;
  readonly isSubmenuOpen: (item: NavMainParentItem) => boolean;
}

interface NavLinkItemProps {
  readonly item: NavMainLinkItem;
  readonly isActive: boolean;
  readonly showIconFallback: boolean;
}

interface NavLinkIconProps {
  readonly item: NavMainLinkItem;
  readonly showFallback: boolean;
}

interface NavDropdownItemProps {
  readonly item: NavMainParentItem;
  readonly isActive: boolean;
  readonly isSubItemActive: (url: AppPath) => boolean;
}

interface NavCollapsibleItemProps {
  readonly item: NavMainParentItem;
  readonly isActive: boolean;
  readonly defaultOpen: boolean;
  readonly isSubItemActive: (url: AppPath) => boolean;
}

function CollapsedIconFallback({ title }: { title: string }) {
  return (
    <span className="flex size-4 shrink-0 items-center justify-center rounded-xs text-xs font-medium outline">
      {title.slice(0, 1)}
    </span>
  );
}

function hasSubItems(item: NavMainItem): item is NavMainParentItem {
  return Boolean(item.subItems?.length);
}

export function NavMain({ items }: NavMainProps) {
  const path = useRouterState({ select: (state) => state.location.pathname });

  const isItemActive = (item: NavMainItem) => {
    if (hasSubItems(item)) {
      return item.subItems.some((sub) => path.startsWith(sub.url));
    }

    return path === item.url;
  };

  const isSubItemActive = (url: AppPath) => {
    return path === url;
  };

  const isSubmenuOpen = (item: NavMainParentItem) => {
    return item.subItems.some((sub) => path.startsWith(sub.url));
  };

  return (
    <>
      {items.map((group) => (
        <SidebarGroup key={group.id} className="p-0 py-0.5">
          <NavSection
            key={`${group.id}-${path}`}
            label={group.label ?? "More"}
            defaultOpen={group.items.some(isItemActive)}
          >
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    isItemActive={isItemActive}
                    isSubItemActive={isSubItemActive}
                    isSubmenuOpen={isSubmenuOpen}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </NavSection>
        </SidebarGroup>
      ))}
    </>
  );
}

function NavSection({
  label,
  children,
  defaultOpen,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  return (
    <Collapsible open={collapsed || open} onOpenChange={setOpen} className="group/nav-section">
      {!collapsed && (
        <CollapsibleTrigger className="text-muted-foreground flex h-9 w-full items-center gap-2 rounded-lg px-3 text-[13px]">
          {label}
          <ChevronRight className={cn("size-3 transition-transform", open && "rotate-90")} />
        </CollapsibleTrigger>
      )}
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}

function NavItem({ item, isItemActive, isSubItemActive, isSubmenuOpen }: NavItemProps) {
  const { state, isMobile } = useSidebar();
  const isCollapsedDesktop = state === "collapsed" && !isMobile;

  if (!hasSubItems(item)) {
    return <NavLinkItem item={item} isActive={isItemActive(item)} showIconFallback={isCollapsedDesktop} />;
  }

  if (isCollapsedDesktop) {
    return <NavDropdownItem item={item} isActive={isItemActive(item)} isSubItemActive={isSubItemActive} />;
  }

  return (
    <NavCollapsibleItem
      item={item}
      isActive={isItemActive(item)}
      defaultOpen={isSubmenuOpen(item)}
      isSubItemActive={isSubItemActive}
    />
  );
}

function NavLinkItem({ item, isActive, showIconFallback }: NavLinkItemProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={
          <Link
            to={item.url}
            activeOptions={{ exact: true, includeSearch: false }}
            onClick={() => {
              if (isMobile) setOpenMobile(false);
            }}
            target={item.newTab ? "_blank" : undefined}
            rel={item.newTab ? "noreferrer" : undefined}
          />
        }
        aria-disabled={item.disabled}
        aria-current={isActive ? "page" : undefined}
        tooltip={item.title}
        isActive={isActive}
      >
        <NavLinkIcon item={item} showFallback={showIconFallback} />
        <span>{item.title}</span>
      </SidebarMenuButton>
      <NavItemBadge badge={item.badge} />
    </SidebarMenuItem>
  );
}

function NavLinkIcon({ item, showFallback }: NavLinkIconProps) {
  const Icon = item.icon;

  if (Icon) {
    return <Icon />;
  }

  if (showFallback) {
    return <CollapsedIconFallback title={item.title} />;
  }

  return null;
}

function NavDropdownItem({ item, isActive, isSubItemActive }: NavDropdownItemProps) {
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<SidebarMenuButton tooltip={item.title} isActive={isActive} disabled={item.disabled} />}
        >
          {Icon ? <Icon /> : <CollapsedIconFallback title={item.title} />}
          <span>{item.title}</span>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" align="start" sideOffset={12} className="w-48">
          <DropdownMenuGroup>
            {item.subItems.map((subItem) => {
              const SubIcon = subItem.icon;

              return (
                <DropdownMenuItem
                  key={subItem.id}
                  render={
                    <Link
                      to={subItem.url}
                      target={subItem.newTab ? "_blank" : undefined}
                      rel={subItem.newTab ? "noreferrer" : undefined}
                      aria-current={isSubItemActive(subItem.url) ? "page" : undefined}
                      className="flex items-center gap-2"
                    />
                  }
                  disabled={subItem.disabled}
                >
                  {SubIcon && <SubIcon />}
                  <span>{subItem.title}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function NavCollapsibleItem({ item, isActive, defaultOpen, isSubItemActive }: NavCollapsibleItemProps) {
  const Icon = item.icon;

  return (
    <Collapsible
      render={<li data-slot="sidebar-menu-item" data-sidebar="menu-item" className="group/menu-item relative" />}
      defaultOpen={defaultOpen}
      className="group/collapsible"
    >
      <CollapsibleTrigger
        render={<SidebarMenuButton tooltip={item.title} isActive={isActive} disabled={item.disabled} />}
      >
        {Icon && <Icon />}
        <span>{item.title}</span>
        <ChevronRight className="ml-auto transition-transform duration-200 group-data-panel-open/menu-button:rotate-90" />
      </CollapsibleTrigger>
      <NavItemBadge badge={item.badge} />

      <CollapsibleContent>
        <SidebarMenuSub>
          {item.subItems.map((subItem) => {
            const SubIcon = subItem.icon;

            return (
              <SidebarMenuSubItem key={subItem.id}>
                <SidebarMenuSubButton
                  render={
                    <Link
                      to={subItem.url}
                      target={subItem.newTab ? "_blank" : undefined}
                      rel={subItem.newTab ? "noreferrer" : undefined}
                    />
                  }
                  aria-current={isSubItemActive(subItem.url) ? "page" : undefined}
                  aria-disabled={subItem.disabled}
                  isActive={isSubItemActive(subItem.url)}
                >
                  {SubIcon && <SubIcon />}
                  <span>{subItem.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

function NavItemBadge({ badge }: { badge?: NavBadge }) {
  if (!badge) {
    return null;
  }

  return (
    <SidebarMenuBadge
      className={cn(
        "rounded-sm border px-1.5 capitalize",
        badge === "new" &&
          "border-success/30 bg-success-surface text-success peer-hover/menu-button:text-success peer-data-active/menu-button:text-success",
        badge === "soon" &&
          "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 peer-hover/menu-button:text-zinc-600 peer-data-active/menu-button:text-zinc-600 dark:border-zinc-400/25 dark:bg-zinc-400/10 dark:text-zinc-300 dark:peer-hover/menu-button:text-zinc-300 dark:peer-data-active/menu-button:text-zinc-300",
        badge === "updated" &&
          "border-blue-600/20 bg-blue-500/10 text-blue-700 peer-hover/menu-button:text-blue-700 peer-data-active/menu-button:text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300 dark:peer-hover/menu-button:text-blue-300 dark:peer-data-active/menu-button:text-blue-300",
      )}
    >
      {badge}
    </SidebarMenuBadge>
  );
}
