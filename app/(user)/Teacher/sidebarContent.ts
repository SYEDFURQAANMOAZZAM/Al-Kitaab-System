'use client'
import {
  LayoutDashboard,
  Layers3,
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
  { title: "Dashboard", href: "/Teacher", icon: LayoutDashboard },
  { title: "Batch", href: "/Teacher/batches", icon: Layers3 },
]
