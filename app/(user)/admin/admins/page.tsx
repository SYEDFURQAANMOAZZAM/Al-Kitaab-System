
import Link from "next/link";
import { Plus } from "lucide-react";

import { ButtonShadcn } from "@/components/button";
import { getAdmins } from "@/app/ServerActions/admin/queries/getAdmins.queries";
import AdminTable from "./AdminTable";

export default async function ManageAdminsPage() {
  const admins = await getAdmins();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Manage Admins
          </h1>

          <p className="text-muted-foreground">
            Manage administrator accounts
          </p>
        </div>

        <Link href="/admin/admins/add">
          <ButtonShadcn className="bg-primary px-5 text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Admin
          </ButtonShadcn>
        </Link>
      </div>

      {/* Admins */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <AdminTable admins={admins} />
      </div>
    </div>
  );
}
