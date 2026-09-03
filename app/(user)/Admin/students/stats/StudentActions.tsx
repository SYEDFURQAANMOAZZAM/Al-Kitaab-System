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

import { deleteStudent } from "@/app/ServerActions/deletion/deleteStudent";

export default function StudentActions({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const router = useRouter();

  const [deletePending, startDeleteTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteStudent = () => {
    startDeleteTransition(async () => {
      const result = await deleteStudent(studentId);

      if (!result.success) {
        window.alert(
          result.error ?? "Failed to delete student."
        );
        return;
      }

      setDeleteDialogOpen(false);

      router.push("/Admin/students/stats");
      router.refresh();
    });
  };

  return (
    <>
      {/* Student actions menu */}
      <Menu.Root>
        <Menu.Trigger className="rounded-lg p-2 hover:bg-muted">
          <MoreVertical className="h-4 w-4" />
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner sideOffset={4} align="end">
            <Menu.Popup className="min-w-40 rounded-md border bg-background p-1 shadow-md">

              <Menu.LinkItem
                render={
                  <Link
                    href={`/Admin/students/stats/${studentId}/profile`}
                  />
                }
                className="flex cursor-pointer items-center rounded-sm px-2 py-2 text-sm hover:bg-muted"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Profile
              </Menu.LinkItem>

              <Menu.LinkItem
                render={
                  <Link
                    href={`/Admin/students/stats/${studentId}/performance`}
                  />
                }
                className="flex cursor-pointer items-center rounded-sm px-2 py-2 text-sm hover:bg-muted"
              >
                <ChartNoAxesColumnIncreasing className="mr-2 h-4 w-4" />
                Performance
              </Menu.LinkItem>

              <Menu.Item
                className="flex cursor-pointer items-center whitespace-nowrap rounded-sm px-2 py-2 text-sm hover:bg-muted"
                onClick={() =>
                  router.push(
                    `/Admin/students/stats/${studentId}/edit`
                  )
                }
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Student
              </Menu.Item>

              <Menu.Separator className="my-1 h-px bg-border" />

              <Menu.Item
                className="flex cursor-pointer items-center rounded-sm px-2 py-2 text-sm text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Student
              </Menu.Item>

            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      {/* Delete confirmation */}
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
                Are you sure you want to delete {studentName} from Maktab?
                This action cannot be undone.
              </AlertDialog.Description>

              {/* Warning */}
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-semibold text-destructive">
                  Warning
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Make sure you understand what will happen to
                  this student&apos;s attendance, progress,
                  performance, and other records.
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <AlertDialog.Close
                  disabled={deletePending}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </AlertDialog.Close>

                <button
                  type="button"
                  disabled={deletePending}
                  onClick={handleDeleteStudent}
                  className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-foreground hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
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