"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BookOpenCheck,
  ChevronDown,
  Languages,
  X,
  LayoutDashboard,
  UserCheck,
  Users,
  Building2,
  Layers3,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  FileText,
  CalendarDays,
  Clock,
  ClipboardList,
  Trophy,
  IndianRupee,
  CreditCard,
  Bell,
  MessageSquare,
  User,
  Settings,
  CircleHelp,
  LogOut,
  Home,
  Search,
  Folder,
  Check,
  Star,
  Target,
  Activity,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { logout } from "@/app/ServerActions/auth/login";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

import ThemeToggle from "./toggleTheme";

/* =========================================================
   ICONS
========================================================= */

export const iconMap = {
  dashboard: LayoutDashboard,
  teacher: UserCheck,
  student: Users,
  users: Users,
  branch: Building2,
  batch: Layers3,
  pattern: Layers3,
  materials: BookOpen,
  book: BookOpen,
  attendance: ClipboardCheck,
  progress: TrendingUp,
  performance: BarChart3,
  report: FileText,
  calendar: CalendarDays,
  schedule: Clock,
  test: ClipboardList,
  result: Trophy,
  fees: IndianRupee,
  payment: CreditCard,
  notification: Bell,
  message: MessageSquare,
  profile: User,
  settings: Settings,
  help: CircleHelp,
  logout: LogOut,
  home: Home,
  search: Search,
  folder: Folder,
  document: FileText,
  check: Check,
  clock: Clock,
  star: Star,
  target: Target,
  activity: Activity,
  analytics: BarChart3,
  shield: ShieldCheck,
};

/* =========================================================
   SIDEBAR TYPES
========================================================= */

export type SidebarIcon = keyof typeof iconMap;

export type SidebarLink = {
  title: string;
  href: string;
  icon: SidebarIcon;
};

export type SidebarGroupItem = {
  title: string;
  icon: SidebarIcon;
  children: SidebarItem[];
};

export type SidebarItem =
  | SidebarLink
  | SidebarGroupItem;

/* =========================================================
   HELPERS
========================================================= */

function isGroup(
  item: SidebarItem
): item is SidebarGroupItem {
  return "children" in item;
}

/**
 * Checks whether any link/group inside an item
 * belongs to the current route.
 */
function isItemActive(
  item: SidebarItem,
  pathname: string
): boolean {
  if (!isGroup(item)) {
    return pathname === item.href;
  }

  return item.children.some((child) =>
    isItemActive(child, pathname)
  );
}

/* =========================================================
   PROPS
========================================================= */

type AppSidebarProps = {
  sidebarItems: SidebarItem[];
};

/* =========================================================
   RECURSIVE SIDEBAR
========================================================= */

function SidebarItems({
  items,
  pathname,
  level = 0,
}: {
  items: SidebarItem[];
  pathname: string;
  level?: number;
}) {
  const [openGroups, setOpenGroups] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};

    items.forEach((item) => {
      if (isGroup(item)) {
        initial[item.title] = isItemActive(
          item,
          pathname
        );
      }
    });

    return initial;
  });

  function toggleGroup(title: string) {
    setOpenGroups((previous) => ({
      ...previous,
      [title]: !previous[title],
    }));
  }

  return (
    <>
      {items.map((item, index) => {
        const Icon = iconMap[item.icon];

        /*
         * Use a combination of title + index.
         * This also works for dynamically generated batches.
         */
        const key = `${item.title}-${level}-${index}`;

        /* =================================================
           GROUP
        ================================================= */

        if (isGroup(item)) {
          const open = openGroups[item.title] ?? false;

          const groupActive = isItemActive(
            item,
            pathname
          );

          return (
            <SidebarMenuItem key={key}>
              <SidebarMenuButton
                onClick={() => toggleGroup(item.title)}
                className={`h-10 rounded-lg text-[15px] ${
                  groupActive
                    ? "font-semibold text-foreground"
                    : "font-normal text-foreground/80"
                }`}
              >
                <Icon
                  className="h-[18px] w-[18px]"
                  strokeWidth={1.75}
                />

                <span>{item.title}</span>

                <ChevronDown
                  className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </SidebarMenuButton>

              {open && (
                <SidebarMenuSub
                  className={
                    level === 0
                      ? "mx-0 border-l-0 pl-9"
                      : "mx-0 border-l-0 pl-6"
                  }
                >
                  <SidebarItems
                    items={item.children}
                    pathname={pathname}
                    level={level + 1}
                  />
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          );
        }

        /* =================================================
           LINK
        ================================================= */

        const active =
          pathname === item.href;

        /*
         * Nested links use SidebarMenuSubItem.
         * Top-level links use SidebarMenuItem.
         */
        if (level > 0) {
          return (
            <SidebarMenuSubItem key={key}>
              <SidebarMenuSubButton
                render={
                  <Link href={item.href} />
                }
                isActive={active}
                className={`h-9 rounded-lg text-[14px] ${
                  active
                    ? "font-semibold text-foreground"
                    : "font-normal text-muted-foreground"
                }`}
              >
                <Icon
                  className="h-4 w-4"
                  strokeWidth={1.75}
                />

                <span>{item.title}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          );
        }

        return (
          <SidebarMenuItem key={key}>
            <SidebarMenuButton
              render={
                <Link href={item.href} />
              }
              isActive={active}
              className={`h-10 rounded-lg text-[15px] ${
                active
                  ? "font-semibold text-foreground"
                  : "font-normal text-foreground/80"
              }`}
            >
              <Icon
                className="h-[18px] w-[18px]"
                strokeWidth={1.75}
              />

              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}

/* =========================================================
   APP SIDEBAR
========================================================= */

export default function AppSidebar({
  sidebarItems,
}: AppSidebarProps) {
  const pathname = usePathname();

  const {
    isMobile,
    setOpenMobile,
  } = useSidebar();

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r-0 shadow-sm"
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpenCheck
              className="h-6 w-6"
              strokeWidth={2}
            />

            <span className="text-lg font-bold tracking-tight">
              Madrasa
            </span>
          </div>

          {isMobile && (
            <button
              type="button"
              onClick={() =>
                setOpenMobile(false)
              }
              aria-label="Close sidebar"
              className="text-foreground/70 hover:text-foreground"
            >
              <X
                className="h-5 w-5"
                strokeWidth={1.75}
              />
            </button>
          )}
        </div>
      </SidebarHeader>

      {/* =================================================
          CONTENT
      ================================================= */}

      <SidebarContent className="px-2 py-3">
        <SidebarGroup className="p-0">
          <SidebarMenu className="gap-0.5">
            <SidebarItems
              items={sidebarItems}
              pathname={pathname}
            />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* =================================================
          FOOTER
      ================================================= */}

      <SidebarFooter className="gap-0 border-t px-4 py-3">
        {/* Language + theme */}

        <div className="flex items-center justify-between py-2">
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-foreground"
          >
            <Languages
              className="h-4 w-4"
              strokeWidth={1.75}
            />

            <span>UR</span>
          </button>

          <ThemeToggle />
        </div>

        {/* User */}

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-sm font-semibold leading-tight">
              Admin User
            </p>

            <p className="text-xs text-muted-foreground">
              Admin
            </p>
          </div>

          <form action={logout}>
            <button
              type="submit"
              aria-label="Logout"
              className="text-destructive hover:opacity-80"
            >
              <LogOut
                className="h-[18px] w-[18px]"
                strokeWidth={1.75}
              />
            </button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
