import AuthVerify from "@/app/ServerActions/auth/authVerify";
import {
  Settings,
  Users,
  Shield,
  Bell,
  Database,
  Building2,
  ChevronRight,
} from "lucide-react";

const settings = [
  {
    title: "Organization",
    description: "Manage organization details and preferences.",
    icon: Building2,
    items: [
      {
        title: "Organization Profile",
        description: "Name, contact details and basic information",
      },
      {
        title: "Academic Structure",
        description: "Manage levels, programs and learning patterns",
      },
    ],
  },
  {
    title: "User Management",
    description: "Manage users, roles and access.",
    icon: Users,
    items: [
      {
        title: "Teachers",
        description: "Manage teacher accounts and permissions",
      },
      {
        title: "Students",
        description: "Manage student accounts and access",
      },
      {
        title: "Roles & Permissions",
        description: "Control what each role can access",
      },
    ],
  },
  {
    title: "Security",
    description: "Manage authentication and security settings.",
    icon: Shield,
    items: [
      {
        title: "Authentication",
        description: "Session and login security settings",
      },
      {
        title: "Access Control",
        description: "Configure administrative access",
      },
    ],
  },
  {
    title: "Notifications",
    description: "Control system notifications.",
    icon: Bell,
    items: [
      {
        title: "Notification Preferences",
        description: "Choose which notifications are enabled",
      },
    ],
  },
  {
    title: "System",
    description: "Manage system-level settings.",
    icon: Database,
    items: [
      {
        title: "Data Management",
        description: "Manage application data and records",
      },
    ],
  },
];

const Page = async () => {
  await AuthVerify("ADMIN");

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Settings className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your organization and application settings.
            </p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-6">
        {settings.map((section) => {
          const Icon = section.icon;

          return (
            <section
              key={section.title}
              className="overflow-hidden rounded-xl border bg-card"
            >
              {/* Section header */}
              <div className="flex items-start gap-3 border-b p-5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-4" />
                </div>

                <div>
                  <h2 className="font-medium">{section.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>

              {/* Settings items */}
              <div>
                {section.items.map((item) => (
                  <button
                    key={item.title}
                    className="flex w-full items-center justify-between gap-4 border-b p-5 text-left last:border-b-0 hover:bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>

                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
};

export default Page;