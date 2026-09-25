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
    href: "/admin/dashboard",
    icon: "dashboard",
  },

  {
    title: "Teacher",
    icon: "teacher",
    children: [
      {
        title: "Teacher Status",
        href: "/admin/teachers/status",
        icon: "teacher",
      },
      {
        title: "Add Teacher",
        href: "/admin/teachers/add",
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
        href: "/admin/students/stats",
        icon: "student",
      },
      {
        title: "Add Student",
        href: "/admin/students/add",
        icon: "student",
      },
    ],
  },

  {
    title: "Branch",
    href: "/admin/branches",
    icon: "branch",
  },

  {
    title: "Subjects",
    href: "/admin/subjects",
    icon: "pattern",
  },
  {
    title: "Subjects Completion",
    href: "/admin/subject-completion",
    icon: "pattern",
  },

  {
    title: "Materials",
    href: "/admin/materials",
    icon: "materials",
  },

  {
    title: "Settings",
    href: "/admin/settings",
    icon: "settings",
  },
];
