import type { SidebarItem } from "@/components/sidebar-types";

type Batch = {
  id: string;
  name: string;
};

export function getSidebarItems(batches: Batch[]): SidebarItem[] {
  return [
    {
      title: "Dashboard",
      href: "/teacher/dashboard",
      icon: "dashboard",
    },
    {
      title: "Branches",
      href: "/teacher/branches",
      icon: "branch",
    },

    ...batches.map((batch) => ({
      title: batch.name,
      icon: "batch" as const,
      children: [
        {
          title: "Attendance",
          href: `/teacher/batches/${batch.id}/attendance`,
          icon: "attendance" as const,
        },
        {
          title: "Progress",
          href: `/teacher/batches/${batch.id}/progress`,
          icon: "progress" as const,
        },
        {
          title: "Performance",
          href: `/teacher/batches/${batch.id}/performance`,
          icon: "performance" as const,
        },
        {
          title: "Students",
          href: `/teacher/batches/${batch.id}/students`,
          icon: "student" as const,
        },
        {
          title: "Teachers",
          href: `/teacher/batches/${batch.id}/teachers`,
          icon: "teacher" as const,
        },
        {
          title: "Subjects",
          href: `/teacher/batches/${batch.id}/subjects`,
          icon: "pattern" as const,
        },
      ],
    })),

    {
      title: "Subject Completion",
      href: "/teacher/subject-completion",
      icon: "pattern",
    },
    {
  title: "My Profile",
  href: "/teacher/profile",
  icon: "profile",
},
{
  title: "My Performance",
  href: "/teacher/performance",
  icon: "performance",
},
{
    title: "Settings",
    href: "/teacher/settings",
    icon: "settings",
  },
  {
      title: "Admin Contacts",
      href: "/teacher/contacts",
      icon: "contacts",
    },
    
  ];
}