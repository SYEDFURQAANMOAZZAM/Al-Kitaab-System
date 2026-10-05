import Link from "next/link";
import { notFound } from "next/navigation";

import BatchForm from "@/components/BatchForm";

import updateBatch from "@/app/ServerActions/batchOperations/actions/updateBatch";

import {
  getAllSubjects,
  getBatchForEdit,
} from "@/app/ServerActions/batchOperations/queries/batch.queries";

import { requireRoleForAction } from "@/lib/auth/require-role";

type Props = {
  params: Promise<{
    branchId: string;
    batchId: string;
  }>;
};

export default async function EditBatchPage({
  params,
}: Props) {
  await requireRoleForAction(["ADMIN"]);

  const { branchId, batchId } = await params;

  const [batch, subjects] = await Promise.all([
    getBatchForEdit(batchId),
    getAllSubjects(),
  ]);

  if (!batch || batch.branchId !== branchId) {
    notFound();
  }

  const assignedSubjectIds = batch.subjects.map(
    (item) => item.subject.id
  );

  const updateAction = updateBatch.bind(
    null,
    batchId
  );

  return (
    <main className="mx-auto w-full mx-auto space-y-6 p-2 sm:p-6">
      <div className="space-y-2">
        <Link
          href={`/admin/branches`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Branch
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">
          Edit Batch
        </h1>

        <p className="text-sm text-muted-foreground">
          Update the batch name and manage its
          assigned subjects.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <BatchForm
          mode="edit"
          branchId={branchId}
          initialName={batch.name}
          subjects={subjects}
          assignedSubjectIds={assignedSubjectIds}
          action={updateAction}
        />
      </div>
    </main>
  );
}