"use client";

import {
  useState,
  useTransition,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Info,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import {
  importToc,
} from "@/app/ServerActions/subjectOperations/bulkToc";

import TocRules, {
  getExampleText,
} from "../toc/toc-rules";

type Part = {
  id: string;
  name: string;
  position: number;
};

type Subject = {
  id: string;
  name: string;
  parts: Part[];
  _count: {
    tocItems: number;
  };
};

export default function BulkTocEditor({
  subject,
}: {
  subject: Subject;
}) {
  const router = useRouter();

  const [
    pending,
    startTransition,
  ] = useTransition();

  const [
    text,
    setText,
  ] = useState("");

  const [
    showSuccess,
    setShowSuccess,
  ] = useState(false);

  const [
    importedCount,
    setImportedCount,
  ] = useState(0);

  const hasExistingToc =
    subject._count.tocItems > 0;

  /*
   * --------------------------------------------------------
   * IMPORT
   * --------------------------------------------------------
   */

  const handleImport = () => {
    if (
      pending ||
      hasExistingToc ||
      !text.trim()
    ) {
      return;
    }

    startTransition(
      async () => {
        const result =
          await importToc({
            subjectId:
              subject.id,

            text: text.trim(),
          });

        if (!result.success) {
          alert(
            result.error ??
              "Failed to import TOC.",
          );

          return;
        }

        /*
         * Import completed.
         *
         * Do NOT navigate here.
         * First show success dialog.
         */

        setImportedCount(
          result.count ?? 0,
        );

        setShowSuccess(true);
      },
    );
  };

  /*
   * --------------------------------------------------------
   * VIEW TOC
   * --------------------------------------------------------
   */

  const handleViewToc = () => {
    setShowSuccess(false);

    router.replace(
      `/Admin/subjects/${subject.id}/toc`,
    );
  };

  return (
    <main className="min-h-screen bg-background">
      {/* =====================================================
          IMPORTING OVERLAY
      ===================================================== */}

      {pending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin" />

            <span className="font-medium">
              Importing TOC...
            </span>
          </div>
        </div>
      )}

      <div className="mx-auto w-full px-2 py-2 sm:px-3 sm:py-3">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="mb-5">
          <Link
            href={`/Admin/subjects/${subject.id}`}
            className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />

            Back to {subject.name}
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Bulk TOC
                </h1>

                <p className="mt-0.5 text-sm text-muted-foreground">
                  Import the complete TOC for{" "}
                  <span className="font-medium text-foreground">
                    {subject.name}
                  </span>
                </p>
              </div>
            </div>

            <Link
              href={`/Admin/subjects/${subject.id}/toc`}
              className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-medium transition-colors hover:bg-muted"
            >
              Manual TOC
            </Link>
          </div>
        </div>

        {/* ===================================================
            EXISTING TOC WARNING
        =================================================== */}

        {hasExistingToc && (
          <section className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />

              <div>
                <p className="text-sm font-medium">
                  This subject already has TOC
                  items.
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Bulk import is blocked when a
                  Subject already contains TOC
                  items. Delete the existing TOC
                  before importing a new one.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================
            MAIN GRID
        =================================================== */}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* =================================================
              INPUT
          ================================================= */}

          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b px-4 py-4 sm:px-5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />

                <h2 className="font-semibold">
                  TOC Input
                </h2>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Paste the complete Subject TOC
                below.
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <textarea
                value={text}
                onChange={(event) =>
                  setText(
                    event.target.value,
                  )
                }
                disabled={
                  pending ||
                  hasExistingToc
                }
                spellCheck={false}
                placeholder={getExampleText(
                  subject,
                )}
                className="min-h-[420px] w-full resize-y rounded-lg border bg-background p-3 font-mono text-sm leading-6 outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 sm:min-h-[600px] sm:p-4"
              />

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Link
                  href={`/Admin/subjects/${subject.id}`}
                  className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </Link>

                <button
                  type="button"
                  disabled={
                    pending ||
                    !text.trim() ||
                    hasExistingToc
                  }
                  onClick={handleImport}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />

                  Import Entire TOC
                </button>
              </div>
            </div>
          </section>

          {/* =================================================
              RULES
          ================================================= */}

          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b px-4 py-4 sm:px-5">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />

                <h2 className="font-semibold">
                  TOC Rules
                </h2>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Follow these rules when preparing
                your import.
              </p>
            </div>

            <div className="max-h-[700px] overflow-y-auto p-4 sm:p-5">
              <TocRules subject={subject} />
            </div>
          </section>
        </div>

        {/* ===================================================
            SAFE IMPORT NOTE
        =================================================== */}

        {!hasExistingToc && (
          <div className="mt-4 rounded-lg border bg-muted/30 p-4">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

              <div>
                <p className="text-sm font-medium">
                  Safe bulk import
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  The TOC is parsed and validated
                  before anything is written to the
                  database. The complete import is
                  saved as one database operation.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          SUCCESS DIALOG
      ===================================================== */}

      {showSuccess && (
        <Dialog
          title="TOC imported successfully"
          onClose={() =>
            setShowSuccess(false)
          }
        >
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                The complete TOC has been
                successfully imported.
              </p>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 text-center">
              <p className="text-2xl font-bold">
                {importedCount}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                TOC items imported
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setShowSuccess(false)
                }
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleViewToc}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                View TOC
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </main>
  );
}

/* ============================================================
   DIALOG
   ============================================================ */

function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-xl border bg-card shadow-2xl">
        {/* Header */}

        <div className="flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
          <h2 className="min-w-0 truncate font-semibold">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}

        <div className="max-h-[calc(90vh-70px)] overflow-y-auto p-4 sm:p-5">
          {children}
        </div>
      </div>
    </div>
  );
}