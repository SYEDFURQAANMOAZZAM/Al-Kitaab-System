"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@base-ui/react/dialog";

import { removeStudentFromBatch } from "@/app/ServerActions/handleGroups/removeStudentFromBatch";
import { removeTeacherFromBatch } from "@/app/ServerActions/handleGroups/removeTeacherFromBatch";

type MemberRole = "STUDENT" | "TEACHER";

type RemoveMemberDialogProps = {
  memberId: string;
  memberName: string | null;
  batchId: string;
  role: MemberRole;

  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoved: () => void;
};

export default function RemoveMemberDialog({
  memberId,
  memberName,
  batchId,
  role,
  open,
  onOpenChange,
  onRemoved,
}: RemoveMemberDialogProps) {
  const [pending, startTransition] =
    useTransition();

  const [error, setError] =
    useState<string | null>(null);

  const memberType =
    role === "STUDENT"
      ? "student"
      : "teacher";

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setError(null);
    }
  };

  const handleRemove = () => {
    setError(null);

    startTransition(async () => {
      const result =
        role === "STUDENT"
          ? await removeStudentFromBatch(
              memberId,
              batchId,
            )
          : await removeTeacherFromBatch(
              memberId,
              batchId,
            );

      if (!result.success) {
        setError(
          result.error ??
            `Failed to remove ${memberType}.`,
        );
        return;
      }

      onOpenChange(false);
      onRemoved();
    });
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={handleOpenChange}
    >
      <Dialog.Portal>
        <Dialog.Backdrop
          className="
            fixed inset-0 z-50
            bg-black/50
          "
        />

        <Dialog.Popup
          className="
            fixed left-1/2 top-1/2 z-50
            w-[calc(100%-2rem)] max-w-md
            -translate-x-1/2 -translate-y-1/2
            rounded-xl border
            bg-popover p-6 text-popover-foreground shadow-xl
          "
        >
          <Dialog.Title className="text-lg font-semibold">
            Remove from Batch
          </Dialog.Title>

          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Are you sure you want to remove{" "}
            <strong className="text-foreground">
              {memberName ?? "this member"}
            </strong>{" "}
            from this batch?
          </Dialog.Description>

          <p className="mt-2 text-sm text-muted-foreground">
            The {memberType} must belong to
            another batch for this action to
            succeed.
          </p>

          {error && (
            <div
              className="
                mt-4 rounded-lg border
                border-destructive/30
                bg-destructive/10
                px-3 py-2
                text-sm text-destructive
              "
            >
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close
              disabled={pending}
              className="
                rounded-lg border
                px-4 py-2
                text-sm font-medium
                hover:bg-accent
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancel
            </Dialog.Close>

            <button
              type="button"
              onClick={handleRemove}
              disabled={pending}
              className="
                rounded-lg
                bg-destructive
                px-4 py-2
                text-sm font-medium
                text-destructive-foreground
                hover:bg-destructive/90
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {pending
                ? "Removing..."
                : "Remove"}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}