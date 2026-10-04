
"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Layers3,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import { createSubject } from "@/app/ServerActions/subjectOperations/createSubject";

type Batch = {
  id: string;
  name: string;
};

type Branch = {
  id: string;
  name: string;
  batches: Batch[];
};

type AddSubjectProps = {
  branches: Branch[];
};

export function AddSubject({ branches }: AddSubjectProps) {
  const [name, setName] = useState("");
  const [parts, setParts] = useState<string[]>([""]);
  const [trackingTerms, setTrackingTerms] = useState<string[]>([""]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allBatches = useMemo(
    () => branches.flatMap((branch) => branch.batches),
    [branches],
  );

  const allBatchIds = useMemo(
    () => allBatches.map((batch) => batch.id),
    [allBatches],
  );

  const allSelected =
    allBatchIds.length > 0 &&
    allBatchIds.every((id) => selectedBatchIds.includes(id));

  function clearFeedback() {
    setError(null);
    setSuccess(null);
  }

  function addPart() {
    clearFeedback();
    setParts((current) => [...current, ""]);
  }

  function removePart(index: number) {
    clearFeedback();
    setParts((current) =>
      current.length > 1
        ? current.filter((_, partIndex) => partIndex !== index)
        : current,
    );
  }

  function updatePart(index: number, value: string) {
    clearFeedback();
    setParts((current) =>
      current.map((part, partIndex) =>
        partIndex === index ? value : part,
      ),
    );
  }

  function addTrackingTerm() {
    clearFeedback();
    setTrackingTerms((current) => [...current, ""]);
  }

  function removeTrackingTerm(index: number) {
    clearFeedback();
    setTrackingTerms((current) =>
      current.length > 1
        ? current.filter((_, termIndex) => termIndex !== index)
        : current,
    );
  }

  function updateTrackingTerm(index: number, value: string) {
    clearFeedback();
    setTrackingTerms((current) =>
      current.map((term, termIndex) =>
        termIndex === index ? value : term,
      ),
    );
  }

  function toggleBatch(batchId: string) {
    clearFeedback();
    setSelectedBatchIds((current) =>
      current.includes(batchId)
        ? current.filter((id) => id !== batchId)
        : [...current, batchId],
    );
  }

  function toggleSelectAll() {
    clearFeedback();
    setSelectedBatchIds(allSelected ? [] : allBatchIds);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isPending) return;

    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    const trimmedParts = parts.map((part) => part.trim());
    const trimmedTrackingTerms = trackingTerms.map((term) => term.trim());

    if (!trimmedName) {
      setError("Subject name is required.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Subject name cannot exceed 100 characters.");
      return;
    }

    if (
      trimmedParts.length === 0 ||
      trimmedParts.some((part) => !part)
    ) {
      setError("Every subject part must have a name.");
      return;
    }

    if (trimmedParts.some((part) => part.length > 100)) {
      setError("Subject part names cannot exceed 100 characters.");
      return;
    }

    if (trimmedTrackingTerms.some((term) => !term)) {
      setError("Every tracking term must have a name.");
      return;
    }

    if (trimmedTrackingTerms.some((term) => term.length > 100)) {
      setError("Tracking term names cannot exceed 100 characters.");
      return;
    }

    const normalizedParts = trimmedParts.map((part) =>
      part.toLowerCase(),
    );

    if (new Set(normalizedParts).size !== normalizedParts.length) {
      setError("Subject parts must have unique names.");
      return;
    }

    const normalizedTerms = trimmedTrackingTerms.map((term) =>
      term.toLowerCase(),
    );

    if (new Set(normalizedTerms).size !== normalizedTerms.length) {
      setError("Tracking terms must have unique names.");
      return;
    }

    const input = {
      name: trimmedName,
      parts: trimmedParts.map((part, index) => ({
        name: part,
        position: index,
      })),
      batchIds: selectedBatchIds,
      trackingTerms: trimmedTrackingTerms.map((term, index) => ({
        name: term,
        position: index,
      })),
    };

    startTransition(async () => {
      try {
        const result = await createSubject(input);

        if (!result.success) {
          setError(result.error ?? "Failed to create subject.");
          return;
        }

        setName("");
        setParts([""]);
        setTrackingTerms([""]);
        setSelectedBatchIds([]);
        setError(null);
        setSuccess("Subject created successfully!");
      } catch {
        setError("Something went wrong while creating the subject.");
      }
    });
  }

  const sectionClass = "border-t px-5 py-6 sm:px-7";

  const addButtonClass =
    "inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg border bg-background px-3 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50 sm:self-auto";

  const itemClass =
    "flex items-center gap-3 rounded-lg border bg-background px-3 py-2 transition focus-within:border-primary/50";

  const inputClass =
    "h-9 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50";

  const removeButtonClass =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Header */}
      <div className="mb-6 px-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Layers3 className="h-4 w-4" />
          <span>Subjects</span>
          <span>/</span>
          <span>Create Subject</span>
        </div>

        <div className="mt-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Create Subject
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a reusable subject, define its parts and tracking terms,
            and assign it to batches.
          </p>
        </div>
      </div>

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border bg-card shadow-sm"
      >
        {/* Basic Information */}
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
              <label htmlFor="subject-name" className="text-sm font-medium">
                Subject Name
              </label>

              <input
                id="subject-name"
                type="text"
                value={name}
                onChange={(e) => {
                  clearFeedback();
                  setName(e.target.value);
                }}
                placeholder="Example: Nazira"
                disabled={isPending}
                required
                maxLength={100}
                className="h-11 w-full rounded-lg border bg-background px-3.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <p className="text-xs text-muted-foreground">
                Use a name that teachers can easily recognize.
              </p>
            </div>
          </div>
        </section>

        {/* Subject Parts */}
        <section className={`${sectionClass} bg-muted/30`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Subject Parts</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add the subject parts in the order they should appear.
              </p>
            </div>

            <button
              type="button"
              onClick={addPart}
              disabled={isPending}
              className={addButtonClass}
            >
              <Plus className="h-4 w-4" />
              Add Part
            </button>
          </div>

          <div className="mt-5 space-y-2">
            {parts.map((part, index) => (
              <div key={index} className={itemClass}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </div>

                <input
                  type="text"
                  value={part}
                  onChange={(e) => updatePart(index, e.target.value)}
                  placeholder={
                    index === 0 ? "Example: Para" : "Example: Surah"
                  }
                  disabled={isPending}
                  required
                  maxLength={100}
                  className={inputClass}
                  aria-label={`Subject part ${index + 1}`}
                />

                {parts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePart(index)}
                    disabled={isPending}
                    className={removeButtonClass}
                    aria-label={`Remove part ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-background px-4 py-3">
            <span className="text-sm text-muted-foreground">
              Subject length
            </span>
            <span className="text-sm font-semibold">
              {parts.length} {parts.length === 1 ? "part" : "parts"}
            </span>
          </div>
        </section>

        {/* Tracking Terms */}
        <section className={`${sectionClass} bg-background`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Tracking Terms</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Define the terms used to track progress for this subject.
              </p>
            </div>

            <button
              type="button"
              onClick={addTrackingTerm}
              disabled={isPending}
              className={addButtonClass}
            >
              <Plus className="h-4 w-4" />
              Add Term
            </button>
          </div>

          <div className="mt-5 space-y-2">
            {trackingTerms.map((term, index) => (
              <div key={index} className={itemClass}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </div>

                <input
                  type="text"
                  value={term}
                  onChange={(e) =>
                    updateTrackingTerm(index, e.target.value)
                  }
                  placeholder={
                    index === 0 ? "Example: Weekly" : "Example: Monthly"
                  }
                  disabled={isPending}
                  required
                  maxLength={100}
                  className={inputClass}
                  aria-label={`Tracking term ${index + 1}`}
                />

                {trackingTerms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTrackingTerm(index)}
                    disabled={isPending}
                    className={removeButtonClass}
                    aria-label={`Remove tracking term ${index + 1}`}
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
              {trackingTerms.length === 1 ? "term" : "terms"}
            </span>
          </div>
        </section>

        {/* Batch Assignment */}
        <section className={`${sectionClass} bg-accent/30`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Apply Subject To</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Select the batches that should use this subject.
              </p>
            </div>

            {allBatchIds.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                disabled={isPending}
                className={addButtonClass}
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>

          <div className="mt-5 space-y-4">
            {branches.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-background px-6 py-10 text-center">
                <Layers3 className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 font-medium">No branches available</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a branch and batch before assigning this subject.
                </p>
              </div>
            ) : (
              branches.map((branch) => (
                <div
                  key={branch.id}
                  className="overflow-hidden rounded-xl border bg-background"
                >
                  <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
                    <div>
                      <h3 className="text-sm font-semibold">
                        {branch.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {branch.batches.length}{" "}
                        {branch.batches.length === 1 ? "batch" : "batches"}
                      </p>
                    </div>
                  </div>

                  {branch.batches.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-muted-foreground">
                      No batches in this branch.
                    </div>
                  ) : (
                    <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
                      {branch.batches.map((batch) => {
                        const selected = selectedBatchIds.includes(batch.id);

                        return (
                          <button
                            key={batch.id}
                            type="button"
                            onClick={() => toggleBatch(batch.id)}
                            disabled={isPending}
                            aria-pressed={selected}
                            className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 text-left transition ${
                              selected
                                ? "border-primary/50 bg-primary/10"
                                : "bg-background hover:bg-muted/50"
                            } disabled:pointer-events-none disabled:opacity-50`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "bg-background"
                              }`}
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

          <div className="mt-4 flex items-center justify-between rounded-lg bg-background px-4 py-3">
            <span className="text-sm text-muted-foreground">
              Selected batches
            </span>
            <span className="text-sm font-semibold">
              {selectedBatchIds.length}
            </span>
          </div>
        </section>

        {/* Success Message */}
        {success && (
          <div className="border-t border-emerald-500/20 bg-emerald-500/5 px-5 py-4 sm:px-7">
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col gap-3 rounded-lg border border-emerald-500/30 bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    {success}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You can create another subject or view all subjects.
                  </p>
                </div>
              </div>

              
            </div>
          </div>
        )}

        {/* Error Message */}
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

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t bg-muted/50 p-5 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Subject...
              </>
            ) : (
              "Create Subject"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
