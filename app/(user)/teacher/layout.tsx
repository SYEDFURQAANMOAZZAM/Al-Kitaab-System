import AppSidebar from "@/components/sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

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
    teacher?.assignments.map((assignment) => assignment.batch) ?? [];

  const sidebarItems = getSidebarItems(batches);

  return (
    <SidebarProvider>
      <AppSidebar sidebarItems={sidebarItems} />

      <SidebarInset className="min-h-svh min-w-0">
        {/* Mobile top bar */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ml-1" />

          <Separator
            orientation="vertical"
            className="mr-2 h-4"
          />
        </header>

        {/* Main page */}
        <main className="min-h-0 min-w-0 flex-1 p-6 max-[430px]:p-2">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}