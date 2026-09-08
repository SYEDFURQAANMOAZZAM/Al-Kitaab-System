export type SidebarIcon =
  | "dashboard"
  | "teacher"
  | "student"
  | "users"
  | "branch"
  | "batch"
  | "pattern"
  | "materials"
  | "book"
  | "attendance"
  | "progress"
  | "performance"
  | "report"
  | "calendar"
  | "schedule"
  | "test"
  | "result"
  | "fees"
  | "payment"
  | "notification"
  | "message"
  | "profile"
  | "settings"
  | "help"
  | "logout"
  | "home"
  | "search"
  | "folder"
  | "document"
  | "check"
  | "clock"
  | "star"
  | "target"
  | "activity"
  | "analytics"
  | "shield";

export type SidebarLink = {
  title: string;
  href: string;
  icon: SidebarIcon;
};

export type SidebarGroupItem = {
  title: string;
  icon: SidebarIcon;
  children: SidebarItem[];
};

export type SidebarItem =
  | SidebarLink
  | SidebarGroupItem;

export const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/Admin/dashboard",
    icon: "dashboard",
  },

  {
    title: "Teacher",
    icon: "teacher",
    children: [
      {
        title: "Teacher Status",
        href: "/Admin/teachers/status",
        icon: "teacher",
      },
      {
        title: "Add Teacher",
        href: "/Admin/teachers/add",
        icon: "teacher",
      },
    ],
  },

  {
    title: "Student",
    icon: "student",
    children: [
      {
        title: "Student Stats",
        href: "/Admin/students/stats",
        icon: "student",
      },
      {
        title: "Add Student",
        href: "/Admin/students/add",
        icon: "student",
      },
    ],
  },

  {
    title: "Branch",
    href: "/Admin/branches",
    icon: "branch",
  },

  {
    title: "Study Pattern",
    href: "/Admin/study-pattern",
    icon: "pattern",
  },

  {
    title: "Materials",
    href: "/Admin/materials",
    icon: "materials",
  },

  {
    title: "Settings",
    href: "/Admin/settings",
    icon: "settings",
  },
];
