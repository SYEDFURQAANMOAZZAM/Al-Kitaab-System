"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Menu } from "@base-ui/react/menu";
import { AlertDialog } from "@base-ui/react/alert-dialog";

import {
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  ChartNoAxesColumnIncreasing,
} from "lucide-react";

import { deleteStudentAction } from "./actions/studentActions";

export default function StudentActions({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const router = useRouter();

  const [deletePending, startDeleteTransition] =
    useTransition();

  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);

  function handleDelete() {
    startDeleteTransition(async () => {
      const result =
        await deleteStudentAction(studentId);

      if (!result.success) {
        window.alert(
          result.error ??
            "Failed to delete student."
        );
        return;
      }

      setDeleteDialogOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Student actions"
        >
          <MoreVertical className="size-4" />
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner
            sideOffset={4}
            align="end"
          >
            <Menu.Popup className="z-50 min-w-48 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg">

              <Menu.LinkItem
                render={
                  <Link
                    href={`/admin/students/stats/${studentId}/profile`}
                  />
                }
                className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                <Eye className="mr-2 size-4" />
                View Profile
              </Menu.LinkItem>

              <Menu.LinkItem
                render={
                  <Link
                    href={`/admin/students/stats/${studentId}/performance`}
                  />
                }
                className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                <ChartNoAxesColumnIncreasing className="mr-2 size-4" />
                View Performance
              </Menu.LinkItem>

              <Menu.Item
                className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm hover:bg-muted"
                onClick={() =>
                  router.push(
                    `/admin/students/stats/${studentId}/edit`
                  )
                }
              >
                <Pencil className="mr-2 size-4" />
                Edit Details
              </Menu.Item>

              <Menu.Separator className="my-1 h-px bg-border" />

              <Menu.Item
                className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                onClick={() =>
                  setDeleteDialogOpen(true)
                }
              >
                <Trash2 className="mr-2 size-4" />
                Delete from Academy
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <AlertDialog.Root
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />

          <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <AlertDialog.Popup className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">

              <AlertDialog.Title className="text-lg font-semibold">
                Delete Student?
              </AlertDialog.Title>

              <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
                Are you sure you want to delete{" "}
                <span className="font-medium text-foreground">
                  {studentName}
                </span>{" "}
                from the academy?
                This action cannot be undone.
              </AlertDialog.Description>

              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-semibold text-destructive">
                  Warning
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  The student&apos;s related academy
                  records may also be removed.
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <AlertDialog.Close
                  disabled={deletePending}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </AlertDialog.Close>

                <button
                  type="button"
                  disabled={deletePending}
                  onClick={handleDelete}
                  className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                >
                  {deletePending
                    ? "Deleting..."
                    : "Delete Student"}
                </button>
              </div>

            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}