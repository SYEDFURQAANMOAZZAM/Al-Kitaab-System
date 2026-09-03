"use client";

import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";

import { Dialog } from "@base-ui/react/dialog";

import { changeStudentBatch } from "@/app/ServerActions/handleGroups/changeStudentBatch";
import { changeTeacherBatch } from "@/app/ServerActions/handleGroups/changeTeacherBatch";

type Role = "STUDENT" | "TEACHER";

type Branch = {
  id: string;
  name: string;
  batches: {
    id: string;
    name: string;
  }[];
};

type ChangeBatchDialogProps = {
  memberId: string;
  memberName: string | null;
  currentBatchId: string;
  role: Role;

  branches: Branch[];

  open: boolean;
  onOpenChange: (open: boolean) => void;

  onChanged: () => void;
};

export default function ChangeBatchDialog({
  memberId,
  memberName,
  currentBatchId,
  role,
  branches,
  open,
  onOpenChange,
  onChanged,
}: ChangeBatchDialogProps) {
  const [branchId, setBranchId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [error, setError] = useState<string | null>(
    null,
  );

  const [changing, startChanging] =
    useTransition();

  const selectedBranch = branches.find(
    (branch) => branch.id === branchId,
  );

  const handleChange = () => {
    if (!batchId) {
      setError("Please select a batch.");
      return;
    }

    if (batchId === currentBatchId) {
      setError(
        `${
          role === "STUDENT"
            ? "Student"
            : "Teacher"
        } is already in this batch.`,
      );
      return;
    }

    setError(null);

    startChanging(async () => {
      try {
        const result =
          role === "STUDENT"
            ? await changeStudentBatch(
                memberId,
                currentBatchId,
                batchId,
              )
            : await changeTeacherBatch(
                memberId,
                currentBatchId,
                batchId,
              );

        if (!result.success) {
          setError(
            result.error ??
              "Failed to change batch.",
          );
          return;
        }

        onOpenChange(false);
        onChanged();
      } catch (error) {
        console.error(
          "Failed to change batch:",
          error,
        );

        setError(
          "Something went wrong while changing the batch.",
        );
      }
    });
  };

  const handleDialogChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setBranchId("");
      setBatchId("");
      setError(null);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={handleDialogChange}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />

        <Dialog.Popup
          className="
            fixed left-1/2 top-1/2 z-50
            w-[calc(100%-2rem)] max-w-md
            -translate-x-1/2 -translate-y-1/2
            rounded-xl border bg-popover p-6 text-popover-foreground shadow-xl
          "
        >
          <Dialog.Title className="text-lg font-semibold">
            Change Batch
          </Dialog.Title>

          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Change{" "}
            <strong>
              {memberName ?? "this member"}
            </strong>{" "}
            to another batch.
          </Dialog.Description>

          <div className="mt-5 space-y-4">
            {/* Branch */}

            <div className="space-y-2">
              <label
                htmlFor="change-batch-branch"
                className="text-sm font-medium"
              >
                Branch
              </label>

              <div className="relative">
                <select
                  id="change-batch-branch"
                  value={branchId}
                  disabled={changing}
                  onChange={(event) => {
                    setBranchId(
                      event.target.value,
                    );
                    setBatchId("");
                    setError(null);
                  }}
                  className="
                    w-full appearance-none
                    rounded-lg border border-input bg-background
                    px-3 py-2 pr-10
                    text-sm outline-none
                    focus:ring-2 focus:ring-ring
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <option value="">
                    Select branch
                  </option>

                  {branches.map((branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  className="
                    pointer-events-none
                    absolute right-3 top-1/2
                    h-4 w-4
                    -translate-y-1/2
                    text-muted-foreground
                  "
                />
              </div>
            </div>

            {/* Batch */}

            <div className="space-y-2">
              <label
                htmlFor="change-batch-batch"
                className="text-sm font-medium"
              >
                Batch
              </label>

              <div className="relative">
                <select
                  id="change-batch-batch"
                  value={batchId}
                  disabled={
                    !branchId ||
                    changing ||
                    !selectedBranch
                  }
                  onChange={(event) => {
                    setBatchId(
                      event.target.value,
                    );
                    setError(null);
                  }}
                  className="
                    w-full appearance-none
                    rounded-lg border border-input bg-background
                    px-3 py-2 pr-10
                    text-sm outline-none
                    focus:ring-2 focus:ring-ring
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <option value="">
                    {!branchId
                      ? "Select branch first"
                      : selectedBranch?.batches.length 
                        ? "Select batch"
                        : "No batches in this branch"}
                  </option>

                  {selectedBranch?.batches.map(
                    (batch) => (
                      <option
                        key={batch.id}
                        value={batch.id}
                      >
                        {batch.name}
                        {batch.id === currentBatchId
                          ? " (Current)"
                          : ""}
                      </option>
                    ),
                  )}
                </select>

                <ChevronDown
                  className="
                    pointer-events-none
                    absolute right-3 top-1/2
                    h-4 w-4
                    -translate-y-1/2
                    text-muted-foreground
                  "
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close
              className="
                rounded-lg border
                px-4 py-2
                text-sm font-medium
                hover:bg-accent
              "
              disabled={changing}
            >
              Cancel
            </Dialog.Close>

            <button
              type="button"
              onClick={handleChange}
              disabled={!batchId || changing}
              className="
                rounded-lg bg-primary
                px-4 py-2
                text-sm font-medium text-primary-foreground
                hover:bg-primary/90
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {changing
                ? "Changing..."
                : `Change ${
                    role === "STUDENT"
                      ? "Student"
                      : "Teacher"
                  }`}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}