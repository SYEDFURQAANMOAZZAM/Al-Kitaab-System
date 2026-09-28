import Link from "next/link";

import { Button } from "@/components/ui/button";
import AdminActions from "./AdminActions";

import { getAdmins } from "@/app/ServerActions/admin/queries/getAdmins.queries";

export default async function ManageAdminsPage() {
  const admins = await getAdmins();

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Manage Admins
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage administrator accounts.
          </p>
        </div>

        <Button>
          <Link href="/admin/admins/add">
            Add Admin
          </Link>
        </Button>
      </div>

      {/* Admins table */}
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium">
                  Name
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Numbers
                </th>

                <th className="px-4 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No admins found.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {admin.name}
                    </td>

                    <td className="px-4 py-3">
                      {admin.phone || "—"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <AdminActions
                        userId={admin.id}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}