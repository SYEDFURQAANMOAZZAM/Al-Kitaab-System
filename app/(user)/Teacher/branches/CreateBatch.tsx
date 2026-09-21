"use client";

import { useActionState, useEffect, useState } from "react";

import createBatch from "@/app/ServerActions/createGroups/createBatch";

import type { GroupActionState } from "@/app/ServerActions/createGroups/createBranch";

import { ButtonShadcn } from "@/components/button";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: GroupActionState = undefined;

type CreateBatchProps = {
  branchId: string;
};

export default function CreateBatch({
  branchId,
}: CreateBatchProps) {
  const [open, setOpen] = useState(false);

  const [state, action, pending] = useActionState(
    createBatch.bind(null, branchId),
    initialState
  );

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
    }
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* =====================================================
          OPEN DIALOG BUTTON
      ===================================================== */}

      <DialogTrigger
        render={
          <ButtonShadcn variant="outline">
            Add Batch
          </ButtonShadcn>
        }
      />

      {/* =====================================================
          DIALOG
      ===================================================== */}

      <DialogContent className="sm:max-w-md">
        <form action={action}>
          <DialogHeader>
            <DialogTitle>Create Batch</DialogTitle>

            <DialogDescription>
              Enter a name for the new batch.
            </DialogDescription>
          </DialogHeader>

          {/* =================================================
              INPUT
          ================================================= */}

          <div className="mt-5 space-y-2">
            <Label htmlFor={`batchname-${branchId}`}>
              Batch Name
            </Label>

            <Input
              id={`batchname-${branchId}`}
              name="batchname"
              placeholder="Enter Batch Name"
              disabled={pending}
              autoFocus
            />
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {state?.error && (
            <p
              className="mt-2 text-sm text-destructive"
              role="alert"
            >
              {state.error}
            </p>
          )}

          {/* =================================================
              SUCCESS
          ================================================= */}

          {state?.success && (
            <p
              className="mt-2 text-sm text-primary"
              role="status"
            >
              {state.success}
            </p>
          )}

          {/* =================================================
              FOOTER
          ================================================= */}

          <DialogFooter className="mt-6">
            <DialogClose
              render={
                <ButtonShadcn
                  type="button"
                  variant="outline"
                  disabled={pending}
                />
              }
            >
              Cancel
            </DialogClose>

            <ButtonShadcn
              type="submit"
              disabled={pending}
            >
              {pending ? "Adding..." : "Add Batch"}
            </ButtonShadcn>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}