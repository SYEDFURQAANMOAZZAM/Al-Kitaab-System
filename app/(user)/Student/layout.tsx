import AppSidebar from "@/components/sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {sidebarItems} from "./sidebarContent";
import { requireRole } from "@/lib/auth/require-role";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("STUDENT");

  return (
    <SidebarProvider>
      <AppSidebar sidebarItems={sidebarItems}/>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ml-1 lg:hidden" />
          <h1>Maktab</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
