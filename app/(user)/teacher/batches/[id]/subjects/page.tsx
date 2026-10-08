import Link from "next/link";
import { notFound } from "next/navigation";

import BatchForm from "@/components/BatchEditOnly";

import updateBatch from "@/app/ServerActions/batchOperations/actions/updateBatch";

import {
  getAllSubjects,
  getBatchForEdit,
} from "@/app/ServerActions/batchOperations/queries/batch.queries";

import { requireRoleForAction } from "@/lib/auth/require-role";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BatchSubjectsPage({
  params,
}: Props) {
  await requireRoleForAction(["TEACHER"]);

  const { id: batchId } = await params;

  const [batch, subjects] = await Promise.all([
    getBatchForEdit(batchId),
    getAllSubjects(),
  ]);

  if (!batch) {
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
    <main className="mx-auto w-full space-y-6 p-2 sm:p-6">
      <div className="space-y-2">
        <Link
          href="/teacher/batches"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Batches
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">
          Batch Subjects
        </h1>

        <p className="text-sm text-muted-foreground">
          View the subjects assigned to this batch.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <BatchForm
          initialName={batch.name}
          subjects={subjects}
          assignedSubjectIds={assignedSubjectIds}
          action={updateAction}
          role="teacher"
        />
      </div>
    </main>
  );
}