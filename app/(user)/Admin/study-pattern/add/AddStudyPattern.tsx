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

import { createPattern } from "@/app/ServerActions/patternOperations/createPattern";
import { updatePattern } from "@/app/ServerActions/patternOperations/updatePattern";

type Batch = {
  id: string;
  name: string;
};

type Branch = {
  id: string;
  name: string;
  batches: Batch[];
};

type PatternPart = {
  id?: string;
  name: string;
  position: number;
};

type Pattern = {
  id: string;
  name: string;
  patternArr: PatternPart[];
  batches: {
    batchId: string;
  }[];
};

type AddStudyPatternProps = {
  branches: Branch[];
  pattern?: Pattern;
};

export function AddStudyPattern({
  branches,
  pattern,
}: AddStudyPatternProps) {
  const router = useRouter();

  const isEditMode = Boolean(pattern);

  /* =========================================================
     STATE
  ========================================================= */

  const [name, setName] = useState(
    pattern?.name ?? ""
  );

  const [parts, setParts] = useState<string[]>(() => {
    if (!pattern?.patternArr?.length) {
      return [""];
    }

    return [...pattern.patternArr]
      .sort((a, b) => a.position - b.position)
      .map((part) => part.name);
  });

  const [selectedBatchIds, setSelectedBatchIds] =
    useState<string[]>(
      pattern?.batches.map(
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

    startTransition(async () => {
      const input = {
        name,
        parts: parts.map(
          (part, index) => ({
            name: part,
            position: index,
          })
        ),
        batchIds: selectedBatchIds,
      };

      const result = isEditMode
        ? await updatePattern({
            id: pattern!.id,
            ...input,
          })
        : await createPattern(input);

      if (!result.success) {
        setError(
          result.error ??
            `Failed to ${
              isEditMode
                ? "update"
                : "create"
            } pattern`
        );

        return;
      }

      router.replace(
        "/Admin/study-pattern"
      );
    });
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
  <div className="mx-auto w-full max-w-5xl ">
    {/* =====================================================
        HEADER
    ===================================================== */}

    <div className="mb-6 px-1">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Layers3 className="h-4 w-4" />
        <span>Study Patterns</span>
        <span>/</span>
        <span>
          {isEditMode ? "Edit Pattern" : "Add Pattern"}
        </span>
      </div>

      <div className="mt-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {isEditMode
            ? "Edit Study Pattern"
            : "Create Study Pattern"}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          {isEditMode
            ? "Update the pattern details and assigned batches."
            : "Create a reusable study pattern and assign it to batches."}
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
              Give your study pattern a clear name.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="pattern-name"
              className="text-sm font-medium"
            >
              Pattern Name
            </label>

            <input
              id="pattern-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example: Hifz Daily Progress"
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
              Use a name that teachers can easily recognize.
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================
          PATTERN PARTS
      =================================================== */}

      <section className="border-t bg-muted/30 px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">
              Pattern Parts
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Add the steps in the order they should appear.
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
                  updatePart(index, e.target.value)
                }
                placeholder={
                  index === 0
                    ? "Example: Surah"
                    : "Example: Sabaq"
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
                  onClick={() => removePart(index)}
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
                  aria-label={`Remove part ${index + 1}`}
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
            Pattern length
          </span>

          <span className="text-sm font-semibold">
            {parts.length}{" "}
            {parts.length === 1 ? "part" : "parts"}
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
              Apply Pattern To
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Select the batches that should use this pattern.
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

        {/* Branches */}

        <div className="mt-5 space-y-4">
          {branches.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-background px-6 py-10 text-center">
              <Layers3 className="mx-auto h-8 w-8 text-muted-foreground" />

              <p className="mt-3 font-medium">
                No branches available
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Create a branch and batch before
                assigning this pattern.
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
                    {branch.batches.map((batch) => {
                      const selected =
                        selectedBatchIds.includes(
                          batch.id
                        );

                      return (
                        <button
                          key={batch.id}
                          type="button"
                          onClick={() =>
                            toggleBatch(batch.id)
                          }
                          disabled={isPending}
                          aria-pressed={selected}
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
                    })}
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
            router.replace("/Admin/study-pattern")
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
                ? "Updating Pattern..."
                : "Creating Pattern..."}
            </>
          ) : isEditMode ? (
            "Update Pattern"
          ) : (
            "Create Pattern"
          )}
        </button>
      </div>
    </form>
  </div>
);
}