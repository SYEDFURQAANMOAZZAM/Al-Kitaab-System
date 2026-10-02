import AdminForm from "@/components/AdminForm";

import { createAdmin } from "@/app/ServerActions/admin/actions/createAdmin";

export default function CreateAdminPage() {
  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 max-[430px]:p-2">
      <AdminForm
        mode="create"
        action={createAdmin}
      />
    </div>
  );
}
