'use client'
import {
  LayoutDashboard,
  UserCheck,
  Users,
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
      { title: "Teacher Status", href: "/Admin/teachers/status" },
      { title: "Add Teacher", href: "/Admin/teachers/add" },
    ],
  },
  {
    title: "Student",
    icon: Users,
    children: [
      { title: "Student Stats", href: "/Admin/students/stats" },
      { title: "Add Student", href: "/Admin/students/add" },
    ],
  },
 
  { title: "Branch", href: "/Admin/branches", icon: Building2 },
  { title: "Materials", href: "/Admin/materials", icon: BookOpen },
  { title: "Settings", href: "/Admin/settings", icon: Settings },
]
