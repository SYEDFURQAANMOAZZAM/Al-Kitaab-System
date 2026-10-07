"use client";

import {
  useState,
} from "react";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  Clock,
  ContactRound,
  CreditCard,
  FileText,
  Folder,
  Home,
  IndianRupee,
  Languages,
  Layers3,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  Trophy,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";

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
  useSidebar,
} from "@/components/ui/sidebar";

import type {
  SidebarItem,
  SidebarGroupItem,
  SidebarIcon,
} from "@/components/sidebar-types";

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
  contacts: ContactRound,
} satisfies Record<SidebarIcon, typeof LayoutDashboard>;


/* =========================================================
   HELPERS
========================================================= */

function isGroup(
  item: SidebarItem,
): item is SidebarGroupItem {
  return (
    "children" in item &&
    Array.isArray(item.children)
  );
}

/**
 * Returns the first link href in a group,
 * including nested groups.
 */
function getFirstLinkHref(
  items: SidebarItem[],
): string | undefined {
  for (const item of items) {
    if ("href" in item) {
      return item.href;
    }

    const href = getFirstLinkHref(item.children);

    if (href) {
      return href;
    }
  }

  return undefined;
}

function getGroupKey(
  item: SidebarGroupItem,
): string {
  return (
    getFirstLinkHref(item.children) ??
    item.title
  );
}

function isLinkActive(
  href: string,
  pathname: string,
): boolean {
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

function isItemActive(
  item: SidebarItem,
  pathname: string,
): boolean {
  if (!isGroup(item)) {
    return isLinkActive(item.href, pathname);
  }

  return item.children.some((child) =>
    isItemActive(child, pathname),
  );
}




/* =========================================================
   RECURSIVE SIDEBAR ITEMS
========================================================= */

function SidebarItems({
  items,
  pathname,
  level = 0,
  onNavigate,
}: {
  items: SidebarItem[];
  pathname: string;
  level?: number;
  onNavigate: () => void;
}) {
  const [
    groupOverrides,
    setGroupOverrides,
  ] = useState<
    Record<string, boolean>
  >({});

  const toggleGroup = (
    key: string,
    currentlyExpanded: boolean,
  ) => {
    setGroupOverrides(
      (current) => ({
        ...current,
        [key]: !currentlyExpanded,
      }),
    );
  };

  return (
    <>
      {items.map(
        (item, index) => {
          const Icon =
            iconMap[item.icon];

          const key =
            `${item.title}-${level}-${index}`;

          /* GROUP / DROPDOWN */

          if (isGroup(item)) {
            const groupKey =
              getGroupKey(item);

            const groupActive =
              isItemActive(
                item,
                pathname,
              );

            const isExpanded =
              groupOverrides[
                groupKey
              ] ?? groupActive;

            return (
              <SidebarMenuItem
                key={key}
              >
                <SidebarMenuButton
                  onClick={() =>
                    toggleGroup(
                      groupKey,
                      isExpanded,
                    )
                  }
                  isActive={
                    groupActive
                  }
                  aria-expanded={
                    isExpanded
                  }
                  className={`h-10 rounded-lg text-[15px] ${
                    groupActive
                      ? "font-semibold text-foreground"
                      : "font-medium text-foreground/80"
                  }`}
                >
                  <Icon
                    className="h-[18px] w-[18px]"
                    strokeWidth={
                      1.75
                    }
                  />

                  <span className="flex-1 truncate">
                    {item.title}
                  </span>

                  <ChevronRight
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      isExpanded
                        ? "rotate-90"
                        : ""
                    }`}
                  />
                </SidebarMenuButton>

                {isExpanded && (
                  <SidebarMenuSub className="mx-0 border-l-0 pl-4">
                    <SidebarItems
                      items={
                        item.children
                      }
                      pathname={
                        pathname
                      }
                      level={
                        level + 1
                      }
                      onNavigate={
                        onNavigate
                      }
                    />
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            );
          }

          /* REGULAR LINK */

          const active =
            isLinkActive(
              item.href,
              pathname,
            );

          /* NESTED LINK */

          if (level > 0) {
            return (
              <SidebarMenuSubItem
                key={key}
              >
                <SidebarMenuSubButton
                  render={
                    <Link
                      href={
                        item.href
                      }
                      onClick={
                        onNavigate
                      }
                    />
                  }
                  isActive={
                    active
                  }
                  className={`h-9 rounded-lg text-[14px] ${
                    active
                      ? "font-semibold text-foreground"
                      : "font-normal text-muted-foreground"
                  }`}
                >
                  <Icon
                    className="h-4 w-4"
                    strokeWidth={
                      1.75
                    }
                  />

                  <span>
                    {
                      item.title
                    }
                  </span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          }

          /* TOP-LEVEL LINK */

          return (
            <SidebarMenuItem
              key={key}
            >
              <SidebarMenuButton
                render={
                  <Link
                    href={
                      item.href
                    }
                    onClick={
                      onNavigate
                    }
                  />
                }
                isActive={
                  active
                }
                className={`h-10 rounded-lg text-[15px] ${
                  active
                    ? "font-semibold text-foreground"
                    : "font-normal text-foreground/80"
                }`}
              >
                <Icon
                  className="h-[18px] w-[18px]"
                  strokeWidth={
                    1.75
                  }
                />

                <span>
                  {item.title}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        },
      )}
    </>
  );
}

/* =========================================================
   APP SIDEBAR
========================================================= */

type AppSidebarProps = {
  sidebarItems: SidebarItem[];
};

export default function AppSidebar({
  sidebarItems,
}: AppSidebarProps) {
  const pathname =
    usePathname();

  const {
    isMobile,
    setOpenMobile,
  } = useSidebar();

 

  /*
   * Close sidebar only on mobile navigation.
   */
  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r-0 shadow-sm"
    >
      {/* =====================================================
          FIXED HEADER
      ===================================================== */}

      <SidebarHeader className="shrink-0 border-b bg-background px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Light theme logo */}

            <Image
              src="/lightThemeLogo.jpeg"
              alt="AlKitaab Academy"
              width={40}
              height={40}
              priority
              className="block h-9 w-9 object-contain dark:hidden"
            />

            {/* Dark theme logo */}

            <Image
              src="/darkThemeLogo.png"
              alt="AlKitaab Academy"
              width={40}
              height={40}
              priority
              className="hidden h-9 w-9 object-contain dark:block"
            />

            <span className="text-lg font-bold tracking-tight">
              Al-Kitaab Academy
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
                strokeWidth={
                  1.75
                }
              />
            </button>
          )}
        </div>
      </SidebarHeader>

      {/* =====================================================
          SCROLLABLE CONTENT
      ===================================================== */}

      <SidebarContent className="min-h-0 flex-1 px-2 py-3">
        <SidebarGroup className="p-0">
          <SidebarMenu className="gap-0.5">
            <SidebarItems
              items={sidebarItems}
              pathname={pathname}
              onNavigate={
                handleNavigate
              }
            />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* =====================================================
          FIXED FOOTER
      ===================================================== */}

      <SidebarFooter className="shrink-0 gap-0 border-t bg-background px-4 py-3">
        {/* Language and theme */}

        <div className="flex items-center justify-between py-2">
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-foreground"
          >
            <Languages
              className="h-4 w-4"
              strokeWidth={
                1.75
              }
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

          <form
            action={logout}
          >
            <button
              type="submit"
              aria-label="Logout"
              className="text-destructive hover:opacity-80"
            >
              <LogOut
                className="h-[18px] w-[18px]"
                strokeWidth={
                  1.75
                }
              />
            </button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
