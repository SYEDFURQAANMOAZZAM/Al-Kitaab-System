import type {
  SidebarItem,
} from "@/components/sidebar-types";

type Batch = {
  id: string;
  name: string;
};

export function getSidebarItems(
  batches: Batch[]
): SidebarItem[] {
  return [
    {
      title: "Dashboard",
      href: "/Teacher",
      icon: "dashboard",
    },

    {
      title: "Branches",
      href: "/Teacher/branches",
      icon: "branch",
    },

    {
      title: "My Batches",
      icon: "batch",

      children: batches.map((batch) => ({
        title: batch.name,
        icon: "batch",

        children: [
          {
            title: "Mark Attendance / Progress",
            href: `/Teacher/batches/${batch.id}/attendance`,
            icon: "attendance",
          },

          {
            title: "Performance",
            href: `/Teacher/batches/${batch.id}/performance`,
            icon: "performance",
          },
        ],
      })),
      
    },
    {
    title: "Materials",
    href: "/Teacher/materials",
    icon: "materials",
  },
  ];
}
