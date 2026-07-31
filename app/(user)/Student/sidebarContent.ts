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
  { title: "Dashboard", href: "/Teacher/dashboard", icon: LayoutDashboard },
  
  { title: "Batch", href: "/Admin/batches", icon: Layers3 },
  { title: "Notice", href: "/Admin/notice", icon: Layers3 },
  { title: "Materials", href: "/Admin/materials", icon: BookOpen },
  { title: "Profile", href: "/Admin/profile", icon: Settings },
]