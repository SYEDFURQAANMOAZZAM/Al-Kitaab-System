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
  { title: "Batch", href: "/Teacher/batches", icon: Layers3 },
  { title: "Students", href: "/Teacher/students", icon: BookOpen },
  { title: "Notice", href: "/Teacher/notice", icon: BookOpen },
  { title: "Materials", href: "/Teacher/materials", icon: BookOpen },
  { title: "Settings", href: "/Teacher/settings", icon: Settings },
]