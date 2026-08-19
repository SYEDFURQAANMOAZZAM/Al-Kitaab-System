"use client";

import { useActionState, useState } from "react";
import UpdateBranch, {
  GroupActionState,
} from "@/app/ServerActions/updation/updateBranch";
import { AlertDialog } from "@base-ui/react/alert-dialog";
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

import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { MoreVertical } from "lucide-react";

import DeleteBranch from "@/app/ServerActions/deletion/deleteBranch";

export default function BranchAction({
  branchName,
  branchId,
  branchBatches,
}: {
  branchName: string;
  branchId: string;
  branchBatches: number;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [instructionDialogOpen, setInstructionDialogOpen] = useState(false);

  const initialState: GroupActionState = undefined;

  const updateBranchAction = async (
        prevState: GroupActionState,
        formData: FormData
      ) => {
        const result = await UpdateBranch(branchId, prevState, formData);

        if (result?.success) {
          setRenameDialogOpen(false);
        }

        return result;
      };

  const [state, action, pending] = useActionState(
    updateBranchAction,
    initialState
  );



  function openDeleteDialog() {

  setDropdownOpen(false);

  if (branchBatches > 0) {

    setInstructionDialogOpen(true);

    return;
  }

  setTimeout(() => {

    setDeleteDialogOpen(true);

  }, 0);
}

  function openRenameDialog() {
    setDropdownOpen(false);

    setTimeout(() => {
      setRenameDialogOpen(true);
    }, 0);
  }

  const [deletestate,deleteAction,deletepending]=useActionState(DeleteBranch.bind(null,branchId),initialState)

  const dialogOpen=deleteDialogOpen && !deletestate?.success

  return (
    <>
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
            hover:bg-slate-100
            hover:text-slate-900
            sm:right-4
          "
          aria-label={`Actions for ${branchName}`}
        >
          <MoreVertical className="h-5 w-5" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={openRenameDialog}>
            Rename Branch
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onClick={openDeleteDialog}
          >
            Delete Branch
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* DELETE DIALOG */}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Branch</DialogTitle>

            <DialogDescription>
              Are you sure you want to delete  &quot;<strong className="font-semibold text-foreground">{branchName}</strong>&quot;  branch?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" />}
            >
              Cancel
            </DialogClose>

            <form action={deleteAction}>
              <Button
                type="submit"
                variant="destructive"
                disabled={deletepending}
              >
                {deletepending ? "Deleting..." : "Delete Branch"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RENAME DIALOG */}

      <Dialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
      >
        <DialogContent className="sm:max-w-sm">
          <form action={action}>
            <DialogHeader>
              <DialogTitle>Rename Branch</DialogTitle>

              <DialogDescription>
                Enter a new name for this branch.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <Label htmlFor={`branchName-${branchId}`}>
                  New Branch Name
                </Label>

                <Input
                  key={branchName}
                  id={`branchName-${branchId}`}
                  name="branchName"
                  defaultValue={branchName}
                  disabled={pending}
                />
              </Field>
            </FieldGroup>

            {state?.error && (
              <p
                className="mt-2 text-sm text-red-600"
                role="alert"
              >
                {state.error}
              </p>
            )}

            <DialogFooter className="mt-4">
              <DialogClose
                render={
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                  />
                }
              >
                Cancel
              </DialogClose>

              <Button
                type="submit"
                disabled={pending}
              >
                {pending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog.Root
  open={instructionDialogOpen}
  onOpenChange={setInstructionDialogOpen}
>
  <AlertDialog.Portal>
    <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />

    <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">

      <AlertDialog.Popup className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">

        <AlertDialog.Title className="text-lg font-semibold">
          Cannot Delete Branch
        </AlertDialog.Title>

        <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
          This branch cannot be deleted while batches are still
          associated with it.
        </AlertDialog.Description>

        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">

          <p className="text-sm font-semibold text-destructive">
            Action Required
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Please delete all batches from this branch before
            deleting the branch.
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