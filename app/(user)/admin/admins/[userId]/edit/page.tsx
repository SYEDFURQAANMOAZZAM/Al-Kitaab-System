import { notFound } from "next/navigation";

import AdminForm from "@/components/AdminForm";

import { updateAdmin } from "@/app/ServerActions/admin/actions/updateAdmin";
import { findAdminForForm } from "@/app/ServerActions/admin/queries/updateAdmin.queries";

type EditAdminPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function EditAdminPage({
  params,
}: EditAdminPageProps) {
  const { userId } = await params;

  const admin = await findAdminForForm(userId);

  if (!admin || admin.role !== "ADMIN") {
    notFound();
  }

  const updateAdminWithId =
    updateAdmin.bind(null, userId);

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <AdminForm
        mode="edit"
        action={updateAdminWithId}
        user={{
          id: admin.id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
        }}
      />
    </div>
  );
}