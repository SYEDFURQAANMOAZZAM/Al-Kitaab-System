import Link from "next/link";
import { notFound } from "next/navigation";

import BatchForm from "@/components/BatchForm";

import createBatch from "@/app/ServerActions/batchOperations/actions/createBatch";

import {
  findBranch,
  getAllSubjects,
} from "@/app/ServerActions/batchOperations/queries/batch.queries";

import { requireRoleForAction } from "@/lib/auth/require-role";

type Props = {
  params: Promise<{
    branchId: string;
  }>;
};

export default async function CreateBatchPage({
  params,
}: Props) {
  await requireRoleForAction(["ADMIN"]);

  const { branchId } = await params;

  const [branch, subjects] = await Promise.all([
    findBranch(branchId),
    getAllSubjects(),
  ]);

  if (!branch) {
    notFound();
  }

  const createAction = createBatch.bind(
    null,
    branchId
  );

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <Link
          href="/admin/branches"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Branches
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">
          Create Batch
        </h1>

        <p className="text-sm text-muted-foreground">
          Create a new batch and assign the subjects
          that will be taught in it.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <BatchForm
          mode="create"
          branchId={branchId}
          subjects={subjects}
          action={createAction}
        />
      </div>
    </main>
  );
}