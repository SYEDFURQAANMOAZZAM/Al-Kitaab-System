"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Layers3,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import { createSubject } from "@/app/ServerActions/subjectOperations/createSubject";
import { updateSubject } from "@/app/ServerActions/subjectOperations/updateSubject";

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
  id?: string;
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

  batches: {
    batchId: string;
  }[];

  trackingTerms: TrackingTerm[];
};

type AddSubjectProps = {
  branches: Branch[];
  subject?: Subject;
};

export function AddSubject({
  branches,
  subject,
}: AddSubjectProps) {
  const router = useRouter();

  const isEditMode = Boolean(subject);

  /* =========================================================
     STATE
  ========================================================= */

  const [name, setName] = useState(
    subject?.name ?? ""
  );

  const [parts, setParts] = useState<string[]>(() => {
    if (!subject?.parts?.length) {
      return [""];
    }

    return [...subject.parts]
      .sort((a, b) => a.position - b.position)
      .map((part) => part.name);
  });

  const [trackingTerms, setTrackingTerms] =
    useState<string[]>(() => {
      if (!subject?.trackingTerms?.length) {
        return [""];
      }

      return [...subject.trackingTerms]
        .sort((a, b) => a.position - b.position)
        .map((term) => term.name);
    });

  const [selectedBatchIds, setSelectedBatchIds] =
    useState<string[]>(
      subject?.batches.map(
        (batch) => batch.batchId
      ) ?? []
    );

  const [error, setError] = useState<string | null>(
    null
  );

  const [isPending, startTransition] =
    useTransition();

  /* =========================================================
     BATCH DATA
  ========================================================= */

  const allBatches = useMemo(
    () =>
      branches.flatMap(
        (branch) => branch.batches
      ),
    [branches]
  );

  const allBatchIds = useMemo(
    () =>
      allBatches.map(
        (batch) => batch.id
      ),
    [allBatches]
  );

  const allSelected =
    allBatchIds.length > 0 &&
    allBatchIds.every((id) =>
      selectedBatchIds.includes(id)
    );

  /* =========================================================
     PART ACTIONS
  ========================================================= */

  function addPart() {
    setParts((current) => [
      ...current,
      "",
    ]);
  }

  function removePart(index: number) {
    setParts((current) =>
      current.filter(
        (_, partIndex) =>
          partIndex !== index
      )
    );
  }

  function updatePart(
    index: number,
    value: string
  ) {
    setParts((current) =>
      current.map(
        (part, partIndex) =>
          partIndex === index
            ? value
            : part
      )
    );
  }

  /* =========================================================
     TRACKING TERM ACTIONS
  ========================================================= */

  function addTrackingTerm() {
    setTrackingTerms((current) => [
      ...current,
      "",
    ]);
  }

  function removeTrackingTerm(index: number) {
    setTrackingTerms((current) =>
      current.filter(
        (_, termIndex) =>
          termIndex !== index
      )
    );
  }

  function updateTrackingTerm(
    index: number,
    value: string
  ) {
    setTrackingTerms((current) =>
      current.map(
        (term, termIndex) =>
          termIndex === index
            ? value
            : term
      )
    );
  }

  /* =========================================================
     BATCH ACTIONS
  ========================================================= */

  function toggleBatch(batchId: string) {
    setSelectedBatchIds((current) => {
      if (current.includes(batchId)) {
        return current.filter(
          (id) => id !== batchId
        );
      }

      return [...current, batchId];
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedBatchIds([]);
    } else {
      setSelectedBatchIds(allBatchIds);
    }
  }

  /* =========================================================
     SUBMIT
  ========================================================= */

  function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (isPending) return;

    setError(null);

    const trimmedName = name.trim();

    const trimmedParts = parts.map(
      (part) => part.trim()
    );

    const trimmedTrackingTerms =
      trackingTerms.map((term) =>
        term.trim()
      );

    if (!trimmedName) {
      setError("Subject name is required.");
      return;
    }

    if (
      trimmedParts.length === 0 ||
      trimmedParts.some((part) => !part)
    ) {
      setError(
        "Every subject part must have a name."
      );
      return;
    }

    if (
      trimmedTrackingTerms.some(
        (term) => !term
      )
    ) {
      setError(
        "Every tracking term must have a name."
      );
      return;
    }

    if (selectedBatchIds.length === 0) {
      setError(
        "Select at least one batch."
      );
      return;
    }

    startTransition(async () => {
      const input = {
        name: trimmedName,

        parts: trimmedParts.map(
          (part, index) => ({
            name: part,
            position: index,
          })
        ),

        batchIds: selectedBatchIds,

        trackingTerms:
          trimmedTrackingTerms.map(
            (term, index) => ({
              name: term,
              position: index,
            })
          ),
      };

      const result = isEditMode
        ? await updateSubject({
            id: subject!.id,
            ...input,
          })
        : await createSubject(input);

      if (!result.success) {
        setError(
          result.error ??
            `Failed to ${
              isEditMode
                ? "update"
                : "create"
            } subject.`
        );

        return;
      }

      router.replace("/admin/subjects");
    });
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6 px-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Layers3 className="h-4 w-4" />

          <span>Subjects</span>

          <span>/</span>

          <span>
            {isEditMode
              ? "Edit Subject"
              : "Add Subject"}
          </span>
        </div>

        <div className="mt-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {isEditMode
              ? "Edit Subject"
              : "Create Subject"}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {isEditMode
              ? "Update the subject details, parts, tracking terms and assigned batches."
              : "Create a reusable subject, define its parts and tracking terms, and assign it to batches."}
          </p>
        </div>
      </div>

      {/* =====================================================
          MAIN FORM
      ===================================================== */}

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border bg-card shadow-sm"
      >
        {/* ===================================================
            BASIC INFORMATION
        =================================================== */}

        <section className="bg-background px-5 py-6 sm:px-7">
          <div className="max-w-2xl">
            <div className="mb-5">
              <h2 className="text-base font-semibold">
                Basic Information
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Give your subject a clear name.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="subject-name"
                className="text-sm font-medium"
              >
                Subject Name
              </label>

              <input
                id="subject-name"
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Example: Nazira"
                disabled={isPending}
                className="
                  h-11
                  w-full
                  rounded-lg
                  border
                  bg-background
                  px-3.5
                  text-sm
                  outline-none
                  transition
                  placeholder:text-muted-foreground
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/20
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              />

              <p className="text-xs text-muted-foreground">
                Use a name that teachers can easily
                recognize.
              </p>
            </div>
          </div>
        </section>

        {/* ===================================================
            SUBJECT PARTS
        =================================================== */}

        <section className="border-t bg-muted/30 px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">
                Subject Parts
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Add the subject parts in the order
                they should appear.
              </p>
            </div>

            <button
              type="button"
              onClick={addPart}
              disabled={isPending}
              className="
                inline-flex
                h-9
                items-center
                justify-center
                gap-2
                self-start
                rounded-lg
                border
                bg-background
                px-3
                text-sm
                font-medium
                transition
                hover:bg-muted
                disabled:pointer-events-none
                disabled:opacity-50
                sm:self-auto
              "
            >
              <Plus className="h-4 w-4" />
              Add Part
            </button>
          </div>

          <div className="mt-5 space-y-2">
            {parts.map((part, index) => (
              <div
                key={index}
                className="
                  flex
                  items-center
                  gap-3
                  rounded-lg
                  border
                  bg-background
                  px-3
                  py-2
                  transition
                  focus-within:border-primary/50
                "
              >
                {/* Number */}

                <div
                  className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-primary/10
                    text-sm
                    font-semibold
                    text-primary
                  "
                >
                  {index + 1}
                </div>

                {/* Input */}

                <input
                  type="text"
                  value={part}
                  onChange={(e) =>
                    updatePart(
                      index,
                      e.target.value
                    )
                  }
                  placeholder={
                    index === 0
                      ? "Example: Para"
                      : "Example: Surah"
                  }
                  disabled={isPending}
                  className="
                    h-9
                    min-w-0
                    flex-1
                    border-0
                    bg-transparent
                    px-1
                    text-sm
                    outline-none
                    placeholder:text-muted-foreground
                  "
                />

                {/* Remove */}

                {parts.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      removePart(index)
                    }
                    disabled={isPending}
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-md
                      text-muted-foreground
                      transition
                      hover:bg-destructive/10
                      hover:text-destructive
                      disabled:pointer-events-none
                      disabled:opacity-40
                    "
                    aria-label={`Remove part ${
                      index + 1
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Parts summary */}

          <div className="mt-4 flex items-center justify-between rounded-lg bg-background px-4 py-3">
            <span className="text-sm text-muted-foreground">
              Subject length
            </span>

            <span className="text-sm font-semibold">
              {parts.length}{" "}
              {parts.length === 1
                ? "part"
                : "parts"}
            </span>
          </div>
        </section>

        {/* ===================================================
            TRACKING TERMS
        =================================================== */}

        <section className="border-t bg-background px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">
                Tracking Terms
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Define the terms used to track progress
                for this subject.
              </p>
            </div>

            <button
              type="button"
              onClick={addTrackingTerm}
              disabled={isPending}
              className="
                inline-flex
                h-9
                items-center
                justify-center
                gap-2
                self-start
                rounded-lg
                border
                bg-background
                px-3
                text-sm
                font-medium
                transition
                hover:bg-muted
                disabled:pointer-events-none
                disabled:opacity-50
                sm:self-auto
              "
            >
              <Plus className="h-4 w-4" />
              Add Term
            </button>
          </div>

          <div className="mt-5 space-y-2">
            {trackingTerms.map((term, index) => (
              <div
                key={index}
                className="
                  flex
                  items-center
                  gap-3
                  rounded-lg
                  border
                  bg-background
                  px-3
                  py-2
                  transition
                  focus-within:border-primary/50
                "
              >
                {/* Number */}

                <div
                  className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-primary/10
                    text-sm
                    font-semibold
                    text-primary
                  "
                >
                  {index + 1}
                </div>

                {/* Input */}

                <input
                  type="text"
                  value={term}
                  onChange={(e) =>
                    updateTrackingTerm(
                      index,
                      e.target.value
                    )
                  }
                  placeholder={
                    index === 0
                      ? "Example: Weekly"
                      : "Example: Monthly"
                  }
                  disabled={isPending}
                  className="
                    h-9
                    min-w-0
                    flex-1
                    border-0
                    bg-transparent
                    px-1
                    text-sm
                    outline-none
                    placeholder:text-muted-foreground
                  "
                />

                {/* Remove */}

                {trackingTerms.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      removeTrackingTerm(index)
                    }
                    disabled={isPending}
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-md
                      text-muted-foreground
                      transition
                      hover:bg-destructive/10
                      hover:text-destructive
                      disabled:pointer-events-none
                      disabled:opacity-40
                    "
                    aria-label={`Remove tracking term ${
                      index + 1
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">
              Tracking terms
            </span>

            <span className="text-sm font-semibold">
              {trackingTerms.length}{" "}
              {trackingTerms.length === 1
                ? "term"
                : "terms"}
            </span>
          </div>
        </section>

        {/* ===================================================
            BATCH ASSIGNMENT
        =================================================== */}

        <section className="border-t bg-accent/30 px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">
                Apply Subject To
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Select the batches that should use this
                subject.
              </p>
            </div>

            {allBatchIds.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                disabled={isPending}
                className="
                  h-9
                  self-start
                  rounded-lg
                  border
                  bg-background
                  px-3
                  text-sm
                  font-medium
                  transition
                  hover:bg-muted
                  disabled:pointer-events-none
                  disabled:opacity-50
                  sm:self-auto
                "
              >
                {allSelected
                  ? "Deselect All"
                  : "Select All"}
              </button>
            )}
          </div>

          <div className="mt-5 space-y-4">
            {branches.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-background px-6 py-10 text-center">
                <Layers3 className="mx-auto h-8 w-8 text-muted-foreground" />

                <p className="mt-3 font-medium">
                  No branches available
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Create a branch and batch before
                  assigning this subject.
                </p>
              </div>
            ) : (
              branches.map((branch) => (
                <div
                  key={branch.id}
                  className="overflow-hidden rounded-xl border bg-background"
                >
                  {/* Branch header */}

                  <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
                    <div>
                      <h3 className="text-sm font-semibold">
                        {branch.name}
                      </h3>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {branch.batches.length}{" "}
                        {branch.batches.length === 1
                          ? "batch"
                          : "batches"}
                      </p>
                    </div>
                  </div>

                  {/* Batch list */}

                  {branch.batches.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-muted-foreground">
                      No batches in this branch.
                    </div>
                  ) : (
                    <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
                      {branch.batches.map(
                        (batch) => {
                          const selected =
                            selectedBatchIds.includes(
                              batch.id
                            );

                          return (
                            <button
                              key={batch.id}
                              type="button"
                              onClick={() =>
                                toggleBatch(
                                  batch.id
                                )
                              }
                              disabled={isPending}
                              aria-pressed={
                                selected
                              }
                              className={`
                                flex
                                min-h-11
                                items-center
                                gap-3
                                rounded-lg
                                border
                                px-3
                                text-left
                                transition

                                ${
                                  selected
                                    ? "border-primary/50 bg-primary/10"
                                    : "bg-background hover:bg-muted/50"
                                }

                                disabled:pointer-events-none
                                disabled:opacity-50
                              `}
                            >
                              <span
                                className={`
                                  flex
                                  h-5
                                  w-5
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-md
                                  border

                                  ${
                                    selected
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "bg-background"
                                  }
                                `}
                              >
                                {selected && (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </span>

                              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                {batch.name}
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Selection summary */}

          <div className="mt-4 flex items-center justify-between rounded-lg bg-background px-4 py-3">
            <span className="text-sm text-muted-foreground">
              Selected batches
            </span>

            <span className="text-sm font-semibold">
              {selectedBatchIds.length}
            </span>
          </div>
        </section>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="border-t bg-destructive/10 px-5 py-4 sm:px-7">
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-background px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          </div>
        )}

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="flex flex-col-reverse gap-3 border-t bg-muted/50 p-5 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={() =>
              router.replace("/admin/subjects")
            }
            disabled={isPending}
            className="
              h-10
              rounded-lg
              border
              bg-background
              px-5
              text-sm
              font-medium
              transition
              hover:bg-muted
              disabled:pointer-events-none
              disabled:opacity-50
            "
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="
              inline-flex
              h-10
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-primary
              px-5
              text-sm
              font-semibold
              text-primary-foreground
              shadow-sm
              transition
              hover:opacity-90
              disabled:pointer-events-none
              disabled:opacity-60
            "
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                {isEditMode
                  ? "Updating Subject..."
                  : "Creating Subject..."}
              </>
            ) : isEditMode ? (
              "Update Subject"
            ) : (
              "Create Subject"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}