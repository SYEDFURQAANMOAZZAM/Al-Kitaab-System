"use client";

import { useActionState, useEffect, useState } from "react";

import createBranch, {
  type GroupActionState,
} from "@/app/ServerActions/createGroups/createBranch";

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

export default function CreateBranch() {
  const [open, setOpen] = useState(false);

  const [state, action, pending] = useActionState(
    createBranch,
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
            Add Branch
          </ButtonShadcn>
        }
      />

      {/* =====================================================
          DIALOG
      ===================================================== */}

      <DialogContent className="sm:max-w-md">
        <form action={action}>
          <DialogHeader>
            <DialogTitle>Create Branch</DialogTitle>

            <DialogDescription>
              Enter a name for the new branch.
            </DialogDescription>
          </DialogHeader>

          {/* =================================================
              INPUT
          ================================================= */}

          <div className="mt-5 space-y-2">
            <Label htmlFor="branchname">
              Branch Name
            </Label>

            <Input
              id="branchname"
              name="branchname"
              placeholder="Enter Branch Name"
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
              {pending ? "Adding..." : "Add Branch"}
            </ButtonShadcn>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}