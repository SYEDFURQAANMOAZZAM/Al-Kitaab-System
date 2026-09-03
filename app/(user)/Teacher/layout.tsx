import AppSidebar from "@/components/sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { getSidebarItems } from "./sidebarContent";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/prisma";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("TEACHER");

  const teacher = await prisma.teacher.findUnique({
    where: {
      userId: user.id,
    },
    select: {
      assignments: {
        select: {
          batch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const batches =
    teacher?.assignments.map(
      (assignment) => assignment.batch
    ) ?? [];

  const sidebarItems = getSidebarItems(batches);

  return (
    <SidebarProvider>
      <AppSidebar sidebarItems={sidebarItems} />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ml-1 lg:hidden" />
          <h1>Maktab</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
