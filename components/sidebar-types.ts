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