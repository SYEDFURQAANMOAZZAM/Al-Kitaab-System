"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  ChevronDown,
  Languages,
  SunMedium,
  LogOut,
  X,
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

type SidebarLink = {
  title: string;
  href: string;
  icon: React.ElementType;
};

type SidebarGroupItem = {
  title: string;
  icon: React.ElementType;
  children: { title: string; href: string }[];
};

type SidebarItem = SidebarLink | SidebarGroupItem;

function isGroup(item: SidebarItem): item is SidebarGroupItem {
  return "children" in item;
}

type AppSidebarProps = {
  sidebarItems: SidebarItem[];
};

export default function AppSidebar({ sidebarItems }: AppSidebarProps) {
  const pathname = usePathname();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    sidebarItems.reduce<Record<string, boolean>>((acc, item) => {
      if (isGroup(item)) {
        acc[item.title] = item.children.some((c) =>
          pathname?.startsWith(c.href)
        );
      }
      return acc;
    }, {})
  );


  const { isMobile, setOpenMobile } = useSidebar();

  const toggleGroup = (title: string) =>
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0 shadow-sm">
      {/* Header: flat, no card wrapper */}
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpenCheck className="h-6 w-6" strokeWidth={2} />
            <span className="text-lg font-bold tracking-tight">Madrasa</span>
          </div>

          {/* Close button — mobile sheet only */}
          {isMobile && (
            <button
              type="button"
              onClick={() => setOpenMobile(false)}
              aria-label="Close sidebar"
              className="text-foreground/70 hover:text-foreground"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </SidebarHeader>

      {/* Nav: flat rows, no group backgrounds */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup className="p-0">
          <SidebarMenu className="gap-0.5">
            {sidebarItems.map((item) => {
              const Icon = item.icon;

              if (isGroup(item)) {
                const open = openGroups[item.title];
                const groupActive = item.children.some(
                  (c) => pathname === c.href
                );
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => toggleGroup(item.title)}
                      className={`h-10 rounded-lg text-[15px] ${
                        groupActive
                          ? "font-semibold text-foreground"
                          : "font-normal text-foreground/80"
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                      <span>{item.title}</span>
                      <ChevronDown
                        className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </SidebarMenuButton>

                    {open && (
                      <SidebarMenuSub className="mx-0 border-l-0 pl-9">
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.href}>
                            <SidebarMenuSubButton
                              render={<Link href={child.href} />}
                              isActive={pathname === child.href}
                              className={`h-9 rounded-lg text-[14px] ${
                                pathname === child.href
                                  ? "font-semibold text-foreground"
                                  : "font-normal text-muted-foreground"
                              }`}
                            >
                              {child.title}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              }

              const active = pathname === item.href;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={active}
                    className={`h-10 rounded-lg text-[15px] ${
                      active
                        ? "font-semibold text-foreground"
                        : "font-normal text-foreground/80"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: utility row + user row, matches screenshot */}
      <SidebarFooter className="gap-0 border-t px-4 py-3">
        {/* Language + theme toggle row */}
        <div className="flex items-center justify-between py-2">
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-foreground"
          >
            <Languages className="h-4 w-4" strokeWidth={1.75} />
            <span>UR</span>
          </button>
          <button
            type="button"
            aria-label="Toggle theme"
            className="text-foreground/80 hover:text-foreground"
          >
            <SunMedium className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
        </div>

        {/* User row */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-sm font-semibold leading-tight">Admin User</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Logout"
              className="text-destructive hover:opacity-80"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}