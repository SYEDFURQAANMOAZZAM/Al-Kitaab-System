"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Trash2, X } from "lucide-react";

import {
  updateSubjectName,
  updateSubjectPartName,
  addSubjectPart,
  deleteSubjectPart,
  updateSubjectBatches,
  updateSubjectTrackingTerms,
} from "@/app/ServerActions/subjectOperations/updateSubject";

type Batch = {
  id: string;
  name: string;
};

type Branch = {
  id: string;
  name: string;
  batches: Batch[];
};

type SubjectPart = {
  id: string;
  name: string;
  position: number;
};

type TrackingTerm = {
  id?: string;
  name: string;
  position: number;
};

type Subject = {
  id: string;
  name: string;
  parts: SubjectPart[];
  batches: { batchId: string }[];
  trackingTerms: TrackingTerm[];
};

type Props = {
  subject: Subject;
  branches: Branch[];
};

export function UpdateSubjectForm({
  subject,
  branches,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(subject.name);
  const [savedName, setSavedName] = useState(subject.name);

  const [parts, setParts] = useState<SubjectPart[]>(
    [...subject.parts]
      .sort((a, b) => a.position - b.position)
      .map((part) => ({ ...part })),
  );

  const [newPartName, setNewPartName] = useState("");
  const [showAddPart, setShowAddPart] = useState(false);

  const [trackingTerms, setTrackingTerms] =
    useState<string[]>(
      [...subject.trackingTerms]
        .sort((a, b) => a.position - b.position)
        .map((term) => term.name),
    );

  const initialTerms = useMemo(
    () =>
      [...subject.trackingTerms]
        .sort((a, b) => a.position - b.position)
        .map((term) => term.name.trim()),
    [subject.trackingTerms],
  );

  const initialBatchIds = useMemo(
    () =>
      subject.batches
        .map((batch) => batch.batchId)
        .sort(),
    [subject.batches],
  );

  const [selectedBatchIds, setSelectedBatchIds] =
    useState<string[]>(initialBatchIds);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * Only used for operations where you specifically
   * want a "try again later" dialog.
   */
  const [retryError, setRetryError] = useState<
    "addPart" | "trackingTerms" | null
  >(null);

  const nameChanged =
    name.trim() !== savedName;

  const termsChanged =
    JSON.stringify(
      trackingTerms.map((term) => term.trim()),
    ) !== JSON.stringify(initialTerms);

  const batchesChanged =
    JSON.stringify([...selectedBatchIds].sort()) !==
    JSON.stringify(initialBatchIds);

  function showResult(result: {
    success: boolean;
    error?: string;
  }) {
    if (!result.success) {
      setError(
        result.error ?? "Update failed.",
      );
      setMessage("");
      return false;
    }

    setError("");
    setMessage(
      "Changes saved successfully.",
    );

    router.refresh();

    return true;
  }

  function saveName() {
    if (
      !name.trim() ||
      !nameChanged ||
      isPending
    ) {
      return;
    }

    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await updateSubjectName({
        subjectId: subject.id,
        name: name.trim(),
      });

      if (showResult(result)) {
        setSavedName(name.trim());
      }
    });
  }

  /*
   * Add Subject Part
   */
  function addPart() {
    const cleanedName =
      newPartName.trim();

    if (!cleanedName || isPending) {
      return;
    }

    setError("");
    setMessage("");

    startTransition(async () => {
      try {
        const result =
          await addSubjectPart({
            subjectId: subject.id,
            name: cleanedName,
          });

        if (!result.success) {
          setRetryError("addPart");
          return;
        }

        const addedPart: SubjectPart =
          result.subjectPart;

        setParts((current) => [
          ...current,
          addedPart,
        ]);

        setNewPartName("");
        setShowAddPart(false);

        setError("");
        setMessage(
          "Subject part added successfully.",
        );

        router.refresh();
      } catch (error) {
        console.error(
          "addPart error:",
          error,
        );

        setRetryError("addPart");
      }
    });
  }

  function savePart(part: SubjectPart) {
    const original =
      subject.parts.find(
        (item) => item.id === part.id,
      );

    const newName =
      part.name.trim();

    if (
      !original ||
      !newName ||
      newName === original.name ||
      isPending
    ) {
      return;
    }

    setError("");
    setMessage("");

    startTransition(async () => {
      const result =
        await updateSubjectPartName({
          subjectPartId: part.id,
          name: newName,
        });

      if (showResult(result)) {
        setParts((current) =>
          current.map((item) =>
            item.id === part.id
              ? {
                  ...item,
                  name: newName,
                }
              : item,
          ),
        );
      }
    });
  }

  function removePart(
    part: SubjectPart,
  ) {
    if (isPending) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${part.name}" and its associated TOC items?`,
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    startTransition(async () => {
      const result =
        await deleteSubjectPart({
          subjectPartId: part.id,
        });

      if (showResult(result)) {
        setParts((current) =>
          current.filter(
            (item) =>
              item.id !== part.id,
          ),
        );
      }
    });
  }

  /*
   * Tracking Terms
   */
  function saveTerms() {
    const cleaned =
      trackingTerms.map((term) =>
        term.trim(),
      );

    /*
     * Normal validation errors.
     * These should NOT open the retry dialog.
     */
    if (cleaned.some((term) => !term)) {
      setError(
        "Enter unique, non-empty tracking terms.",
      );
      setMessage("");
      return;
    }

    if (
      new Set(
        cleaned.map((term) =>
          term.toLowerCase(),
        ),
      ).size !== cleaned.length
    ) {
      setError(
        "Tracking terms must be unique.",
      );
      setMessage("");
      return;
    }

    if (
      isPending ||
      !termsChanged
    ) {
      return;
    }

    setError("");
    setMessage("");

    startTransition(async () => {
      try {
        const result =
          await updateSubjectTrackingTerms({
            subjectId: subject.id,
            trackingTerms:
              cleaned.map(
                (term, position) => ({
                  name: term,
                  position,
                }),
              ),
          });

        /*
         * Server/query failure.
         * Show retry dialog instead of the
         * normal page-level error.
         */
        if (!result.success) {
          setRetryError(
            "trackingTerms",
          );
          return;
        }

        setError("");
        setMessage(
          "Tracking terms saved successfully.",
        );

        router.refresh();
      } catch (error) {
        console.error(
          "saveTerms error:",
          error,
        );

        setRetryError(
          "trackingTerms",
        );
      }
    });
  }

  function saveBatches() {
    if (
      isPending ||
      !batchesChanged
    ) {
      return;
    }

    setError("");
    setMessage("");

    startTransition(async () => {
      const result =
        await updateSubjectBatches({
          subjectId: subject.id,
          batchIds: selectedBatchIds,
        });

      if (showResult(result)) {
        router.refresh();
      }
    });
  }

  function toggleBatch(
    batchId: string,
  ) {
    setSelectedBatchIds(
      (current) =>
        current.includes(batchId)
          ? current.filter(
              (id) => id !== batchId,
            )
          : [...current, batchId],
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">
            Update Subject
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Save each section independently.
          </p>
        </div>

        {/* General error */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {/* General success */}
        {message && (
          <div
            role="status"
            className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm"
          >
            {message}
          </div>
        )}

        {/* =========================================
            SUBJECT NAME
        ========================================== */}
        <section className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
          <h2 className="font-semibold">
            Subject Name
          </h2>

          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              disabled={isPending}
              placeholder="Subject name"
              className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm sm:flex-1"
            />

            <button
              type="button"
              onClick={saveName}
              disabled={
                isPending ||
                !nameChanged ||
                !name.trim()
              }
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-40 sm:w-auto"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}

              Save Name
            </button>
          </div>
        </section>

        {/* =========================================
            SUBJECT PARTS
        ========================================== */}
        <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold">
                Subject Parts
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Add, rename, or delete subject parts.
              </p>
            </div>

            {!showAddPart && (
              <button
                type="button"
                onClick={() =>
                  setShowAddPart(true)
                }
                disabled={isPending}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border px-3 text-sm hover:bg-muted disabled:opacity-40 sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Add Part
              </button>
            )}
          </div>

          {/* Add Part */}
          {showAddPart && (
            <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
              <input
                autoFocus
                value={newPartName}
                onChange={(e) =>
                  setNewPartName(
                    e.target.value,
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter"
                  ) {
                    addPart();
                  }

                  if (
                    e.key === "Escape"
                  ) {
                    setNewPartName("");
                    setShowAddPart(false);
                  }
                }}
                disabled={isPending}
                placeholder="New subject part"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              />

              <div className="flex w-full gap-2">
                <button
                  type="button"
                  onClick={addPart}
                  disabled={
                    isPending ||
                    !newPartName.trim()
                  }
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-40 sm:flex-none"
                >
                  {isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  Add
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewPartName("");
                    setShowAddPart(false);
                  }}
                  disabled={isPending}
                  className="h-10 flex-1 rounded-md border px-4 text-sm hover:bg-muted disabled:opacity-40 sm:flex-none"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {parts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No parts found.
            </p>
          )}

          {/* Existing Parts */}
          <div className="space-y-3">
            {parts.map(
              (part, index) => {
                const original =
                  subject.parts.find(
                    (item) =>
                      item.id === part.id,
                  );

                const changed =
                  part.name.trim() !==
                  (original?.name ?? "");

                return (
                  <div
                    key={part.id}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </span>

                      <input
                        value={part.name}
                        onChange={(e) =>
                          setParts(
                            (current) =>
                              current.map(
                                (item) =>
                                  item.id ===
                                  part.id
                                    ? {
                                        ...item,
                                        name: e
                                          .target
                                          .value,
                                      }
                                    : item,
                              ),
                          )
                        }
                        disabled={isPending}
                        className="h-10 w-full min-w-0 flex-1 rounded-md border bg-background px-3 text-sm"
                      />
                    </div>

                    <div className="mt-2 flex w-full gap-2 pl-10">
                      <button
                        type="button"
                        onClick={() =>
                          savePart(part)
                        }
                        disabled={
                          isPending ||
                          !changed ||
                          !part.name.trim()
                        }
                        className="h-10 flex-1 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-40 sm:flex-none"
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removePart(part)
                        }
                        disabled={
                          isPending
                        }
                        aria-label={`Delete ${part.name}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </section>

        {/* =========================================
            TRACKING TERMS
        ========================================== */}
        <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold">
                Tracking Terms
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Changes are saved together.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setTrackingTerms(
                  (current) => [
                    ...current,
                    "",
                  ],
                )
              }
              disabled={isPending}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border px-3 text-sm hover:bg-muted disabled:opacity-40 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Term
            </button>
          </div>

          <div className="space-y-2">
            {trackingTerms.map(
              (term, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg border p-2"
                >
                  <span className="w-7 shrink-0 text-center text-sm text-muted-foreground">
                    {index + 1}
                  </span>

                  <input
                    value={term}
                    onChange={(e) =>
                      setTrackingTerms(
                        (current) =>
                          current.map(
                            (item, i) =>
                              i === index
                                ? e.target
                                    .value
                                : item,
                          ),
                      )
                    }
                    disabled={isPending}
                    placeholder="Tracking term"
                    className="h-10 w-full min-w-0 flex-1 rounded-md border bg-background px-3 text-sm"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setTrackingTerms(
                        (current) =>
                          current.filter(
                            (_, i) =>
                              i !== index,
                          ),
                      )
                    }
                    disabled={isPending}
                    aria-label={`Remove tracking term ${
                      index + 1
                    }`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveTerms}
              disabled={
                isPending ||
                !termsChanged
              }
              className="h-10 w-full rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-40 sm:w-auto"
            >
              Save Tracking Terms
            </button>
          </div>
        </section>

        {/* =========================================
            ASSIGNED BATCHES
        ========================================== */}
        <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
          <div>
            <h2 className="font-semibold">
              Assigned Batches
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Select the batches that should use
              this subject.
            </p>
          </div>

          {branches.map(
            (branch) => (
              <div
                key={branch.id}
                className="overflow-hidden rounded-lg border"
              >
                <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">
                  {branch.name}
                </div>

                {branch.batches.length ===
                0 ? (
                  <p className="p-3 text-sm text-muted-foreground">
                    No batches in this
                    branch.
                  </p>
                ) : (
                  <div className="grid gap-2 p-3 sm:grid-cols-2">
                    {branch.batches.map(
                      (batch) => {
                        const selected =
                          selectedBatchIds.includes(
                            batch.id,
                          );

                        return (
                          <label
                            key={batch.id}
                            className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={
                                selected
                              }
                              disabled={
                                isPending
                              }
                              onChange={() =>
                                toggleBatch(
                                  batch.id,
                                )
                              }
                            />

                            <span>
                              {
                                batch.name
                              }
                            </span>
                          </label>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            ),
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedBatchIds.length}{" "}
              selected
            </span>

            <button
              type="button"
              onClick={saveBatches}
              disabled={
                isPending ||
                !batchesChanged
              }
              className="h-10 w-full rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-40 sm:w-auto"
            >
              Save Batches
            </button>
          </div>
        </section>
      </div>

      {/* =========================================
          RETRY DIALOG
      ========================================== */}
      {retryError && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              setRetryError(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="retry-dialog-title"
            className="w-full max-w-sm rounded-xl border bg-card p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="retry-dialog-title"
                  className="font-semibold"
                >
                  Something went wrong
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  We couldn&apos;t{" "}
                  {retryError ===
                  "addPart"
                    ? "add the subject part"
                    : "save the tracking terms"}
                  .
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setRetryError(null)
                }
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              Please try again later.
            </p>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setRetryError(null)
                }
                className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Try Again Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}