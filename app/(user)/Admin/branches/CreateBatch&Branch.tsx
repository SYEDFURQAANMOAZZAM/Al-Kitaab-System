'use client'

import { useActionState } from "react";
import createBatch from "@/app/ServerActions/handleGroups/createBatch";
import createBranch, { type GroupActionState } from "@/app/ServerActions/handleGroups/createBranch";
import { ButtonShadcn } from "@/components/button";

const initialState: GroupActionState = undefined;

type CreateBatchProps = { branchId: string };

export function CreateBatch({ branchId }: CreateBatchProps) {
  const [state, action, pending] = useActionState(createBatch.bind(null, branchId), initialState);

  return (
    <form action={action} className="space-y-2">
      <label htmlFor={`batchname-${branchId}`}>New Batch:</label>
      <input id={`batchname-${branchId}`} name="batchname" placeholder="Enter Batch Name" />
      <ButtonShadcn variant="outline" type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add"}
      </ButtonShadcn>
      {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary" role="status">{state.success}</p>}
    </form>
  );
}

export function CreateBranch() {
  const [state, action, pending] = useActionState(createBranch, initialState);

  return (
    <form action={action} className="space-y-2">
      <label htmlFor="branchname">New Branch:</label>
      <input id="branchname" name="branchname" placeholder="Enter Branch Name" />
      <ButtonShadcn variant="outline" type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add"}
      </ButtonShadcn>
      {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary" role="status">{state.success}</p>}
    </form>
  );
}
