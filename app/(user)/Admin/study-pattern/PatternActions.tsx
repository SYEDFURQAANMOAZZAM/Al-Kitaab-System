"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { deletePattern } from "@/app/ServerActions/patternOperations/deletePattern";

type PatternActionsProps = {
  patternId: string;
  patternName: string;
};

export function PatternActions({
  patternId,
  patternName,
}: PatternActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);

  const [deleteError, setDeleteError] = useState<
    string | null
  >(null);

  const [isPending, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);

  /*
   * Close action menu when clicking outside.
   */
  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [isOpen]);

  /*
   * Close everything with Escape.
   */
  useEffect(() => {
    if (!isOpen && !showDeleteDialog) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" && !isPending) {
        return;
      }

      if (event.key === "Escape" && !isPending) {
        setShowDeleteDialog(false);
        setIsOpen(false);
        setDeleteError(null);
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isOpen, showDeleteDialog, isPending]);

  /*
   * Open confirmation dialog.
   */
  function openDeleteDialog() {
    setIsOpen(false);
    setDeleteError(null);
    setShowDeleteDialog(true);
  }

  /*
   * Cancel deletion.
   */
  function cancelDelete() {
    if (isPending) return;

    setShowDeleteDialog(false);
    setDeleteError(null);
  }

  /*
   * Delete pattern.
   */
  function handleDelete() {
    setDeleteError(null);

    startTransition(async () => {
      const result = await deletePattern(patternId);

      if (!result.success) {
        setDeleteError(
          result.error ??
            "Failed to delete pattern"
        );

        return;
      }

      setShowDeleteDialog(false);
      setIsOpen(false);

      window.location.reload();
    });
  }

  return (
    <>
      {/* =====================================================
          ACTION MENU
      ===================================================== */}

      <div
        ref={containerRef}
        className="relative flex shrink-0 justify-end"
      >
        <button
          type="button"
          onClick={() =>
            setIsOpen((current) => !current)
          }
          aria-label={`Actions for ${patternName}`}
          aria-expanded={isOpen}
          className={[
            "flex h-8 w-8 items-center justify-center",
            "rounded-md",
            "text-muted-foreground",
            "transition-colors",
            "hover:bg-muted",
            "hover:text-foreground",
            "focus:outline-none",
            "focus:ring-2",
            "focus:ring-primary/20",
            isOpen
              ? "bg-muted text-foreground"
              : "",
          ].join(" ")}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-10 z-50 w-44 rounded-xl border bg-background p-1.5 shadow-xl shadow-black/10">
            {/* View */}

            <Link
              href={`/Admin/study-pattern/${patternId}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted"
            >
              <Eye className="h-4 w-4 text-muted-foreground" />

              <span>View</span>
            </Link>

            {/* Edit */}

            <Link
              href={`/Admin/study-pattern/${patternId}/edit`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted"
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />

              <span>Edit</span>
            </Link>

            {/* Separator */}

            <div
              role="separator"
              className="my-1.5 h-px bg-border"
            />

            {/* Delete */}

            <button
              type="button"
              onClick={openDeleteDialog}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />

              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* =====================================================
          DELETE CONFIRMATION DIALOG
      ===================================================== */}

      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isPending
            ) {
              cancelDelete();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-pattern-title"
            aria-describedby="delete-pattern-description"
            className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            {/* Icon */}

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="delete-pattern-title"
                  className="text-lg font-semibold"
                >
                  Delete study pattern?
                </h2>

                <p
                  id="delete-pattern-description"
                  className="mt-2 text-sm leading-6 text-muted-foreground"
                >
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-foreground">
                    `{patternName}`
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>

              {/* Close */}

              <button
                type="button"
                disabled={isPending}
                onClick={cancelDelete}
                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error */}

            {deleteError && (
              <div className="mt-5 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                {deleteError}
              </div>
            )}

            {/* Buttons */}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isPending}
                onClick={cancelDelete}
                className="h-10 rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Pattern
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}