'use client'
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Layers3,
  Building2,
  BookOpen,
  Settings,
} from "lucide-react";

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


export const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { title: "Notice", href: "/student/notice", icon: Layers3 },
  { title: "Materials", href: "/student/materials", icon: BookOpen },
  { title: "Profile", href: "/student/profile", icon: Settings },
]