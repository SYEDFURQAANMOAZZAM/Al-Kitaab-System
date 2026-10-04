import type { SidebarItem } from "@/components/sidebar-types";

export const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/student/dashboard",
    icon: "dashboard",
  },
  {
    title: "Subjects Completions",
    href: "/student/subject-completion",
    icon: "pattern",
  },
  {
    title: "My Profile",
    href: "/student/profile",
    icon: "profile",
  },
  {
    title: "Admin & Teacher Contacts",
    href: "/student/contacts",
    icon: "contacts",
  },
];