
"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { AlertDialog } from "@base-ui/react/alert-dialog";

import DeleteBatch from "@/app/ServerActions/batchOperations/actions/deleteBatch";
import type { GroupActionState } from "@/app/ServerActions/batchOperations/types/batch.types";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const initialState: GroupActionState = undefined;

type BatchActionProps = {
  batchName: string;
  batchId: string;
  branchId: string;
  batchStudents: number;
  batchTeachers: number;
};

export default function BatchAction({
  batchName,
  batchId,
  branchId,
  batchStudents,
  batchTeachers,
}: BatchActionProps) {
  const router = useRouter();

  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);

  const [dropdownOpen, setDropdownOpen] =
    useState(false);

  const [instructionDialogOpen, setInstructionDialogOpen] =
    useState(false);

  const [deleteState, deleteAction, deletePending] =
    useActionState(
      DeleteBatch.bind(null, batchId),
      initialState
    );

  const dialogOpen =
    deleteDialogOpen && !deleteState?.success;

  function openEditPage() {
    setDropdownOpen(false);

    router.push(
      `/teacher/branches/${branchId}/batches/${batchId}/edit`
    );
  }

  function openDeleteDialog() {
    setDropdownOpen(false);

    if (batchStudents > 0 || batchTeachers > 0) {
      setInstructionDialogOpen(true);
      return;
    }

    setDeleteDialogOpen(true);
  }

  return (
    <>
      {/* Dropdown Menu */}

      <DropdownMenu
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
      >
        <DropdownMenuTrigger
          className="
            absolute
            right-3
            top-1/2
            z-10
            -translate-y-1/2
            rounded-lg
            p-2
            text-muted-foreground
            transition
            hover:bg-accent
            hover:text-accent-foreground
            sm:right-4
          "
          aria-label={`Actions for ${batchName}`}
        >
          <MoreVertical className="h-5 w-5" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={openEditPage}>
            Edit Batch
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onClick={openDeleteDialog}
          >
            Delete Batch
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Dialog */}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Delete Batch
            </DialogTitle>

            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong className="font-semibold text-foreground">
                {batchName}
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteState?.error && (
            <p
              className="text-sm text-destructive"
              role="alert"
            >
              {deleteState.error}
            </p>
          )}

          <DialogFooter>
            <DialogClose
              render={
                <Button
                  variant="outline"
                  disabled={deletePending}
                />
              }
            >
              Cancel
            </DialogClose>

            <form action={deleteAction}>
              <Button
                type="submit"
                variant="destructive"
                disabled={deletePending}
              >
                {deletePending
                  ? "Deleting..."
                  : "Delete Batch"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assigned Students / Teachers Warning */}

      <AlertDialog.Root
        open={instructionDialogOpen}
        onOpenChange={setInstructionDialogOpen}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />

          <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <AlertDialog.Popup className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
              <AlertDialog.Title className="text-lg font-semibold">
                Cannot Delete Batch
              </AlertDialog.Title>

              <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
                This batch cannot be deleted while
                students or teachers are still assigned
                to it.
              </AlertDialog.Description>

              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-semibold text-destructive">
                  Action Required
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Please remove all students and teachers
                  from this batch before deleting it.
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <AlertDialog.Close
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Okay
                </AlertDialog.Close>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
