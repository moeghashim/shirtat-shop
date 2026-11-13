import { Blocks, LayoutDashboard, type LucideIcon, MessagesSquare, Palette, UserRound } from "lucide-react";

import type { FileRoutesByTo } from "@/routeTree.gen";

export type NavBadge = "new" | "updated" | "soon";
export type AppPath = keyof FileRoutesByTo;

export interface NavSubItem {
  id: string;
  title: string;
  url: AppPath;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: AppPath;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

/** Sidebar items only owners see; designers keep Designers and Pages. */
export const OWNER_ONLY_ITEMS: ReadonlySet<string> = new Set(["chats", "seo"]);

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Dashboards",
    items: [
      {
        id: "designers",
        title: "Designers",
        url: "/dashboard/designers",
        icon: Palette,
      },
      {
        id: "chats",
        title: "Chat review",
        url: "/dashboard/chats",
        icon: MessagesSquare,
      },
      {
        id: "seo",
        title: "SEO",
        url: "/dashboard/seo",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: "Pages",
    items: [
      {
        id: "profile",
        title: "Profile",
        url: "/dashboard/profile",
        icon: UserRound,
      },
      {
        id: "kit",
        title: "Blocks kit",
        url: "/dashboard/kit",
        icon: Blocks,
      },
    ],
  },
];
