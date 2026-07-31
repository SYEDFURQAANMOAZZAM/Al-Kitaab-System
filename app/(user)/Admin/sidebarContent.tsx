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
  { title: "Dashboard", href: "/Admin/dashboard", icon: LayoutDashboard },
  {
    title: "Teacher",
    icon: UserCheck,
    children: [
      { title: "Teacher Access", href: "/Admin/teachers/access" },
      { title: "Teacher Status", href: "/Admin/teachers/status" },
    ],
  },
  {
    title: "Student",
    icon: Users,
    children: [
      { title: "Student Access", href: "/Admin/students/access" },
      { title: "Student Status", href: "/Admin/students/status" },
    ],
  },
  { title: "Batch", href: "/Admin/batches", icon: Layers3 },
  { title: "Branch", href: "/Admin/branches", icon: Building2 },
  { title: "Materials", href: "/Admin/materials", icon: BookOpen },
  { title: "Settings", href: "/Admin/settings", icon: Settings },
]