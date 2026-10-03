
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";

import {
  updateSubjectName,
  updateSubjectPartName,
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

export function UpdateSubjectForm({ subject, branches }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(subject.name);
  const [savedName, setSavedName] = useState(subject.name);

  const [parts, setParts] = useState(
    [...subject.parts]
      .sort((a, b) => a.position - b.position)
      .map((part) => ({ ...part })),
  );

  const [trackingTerms, setTrackingTerms] = useState(
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
    () => subject.batches.map((batch) => batch.batchId).sort(),
    [subject.batches],
  );

  const [selectedBatchIds, setSelectedBatchIds] =
    useState<string[]>(initialBatchIds);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const allBatches = useMemo(
    () => branches.flatMap((branch) => branch.batches),
    [branches],
  );

  const allBatchIds = allBatches.map((batch) => batch.id);

  const nameChanged = name.trim() !== savedName;

  const termsChanged =
    JSON.stringify(trackingTerms.map((term) => term.trim())) !==
    JSON.stringify(initialTerms);

  const batchesChanged =
    JSON.stringify([...selectedBatchIds].sort()) !==
    JSON.stringify(initialBatchIds);

  function showResult(result: {
    success: boolean;
    error?: string;
  }) {
    if (!result.success) {
      setError(result.error ?? "Update failed.");
      setMessage("");
      return false;
    }

    setError("");
    setMessage("Changes saved successfully.");
    router.refresh();
    return true;
  }

  function saveName() {
    if (!name.trim() || !nameChanged || isPending) return;

    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await updateSubjectName({
        subjectId: subject.id,
        name: name.trim(),
      });

      if (showResult(result)) setSavedName(name.trim());
    });
  }

  function savePart(part: SubjectPart) {
    const original = subject.parts.find((item) => item.id === part.id);
    const newName = part.name.trim();

    if (!original || !newName || newName === original.name || isPending) {
      return;
    }

    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await updateSubjectPartName({
        subjectPartId: part.id,
        name: newName,
      });

      if (showResult(result)) {
        setParts((current) =>
          current.map((item) =>
            item.id === part.id ? { ...item, name: newName } : item,
          ),
        );
      }
    });
  }

  function removePart(part: SubjectPart) {
    if (isPending) return;

    const confirmed = window.confirm(
      `Delete "${part.name}" and its associated TOC items?`,
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await deleteSubjectPart({
        subjectPartId: part.id,
      });

      if (showResult(result)) {
        setParts((current) =>
          current.filter((item) => item.id !== part.id),
        );
      }
    });
  }

  function saveTerms() {
    const cleaned = trackingTerms.map((term) => term.trim());

    if (
      isPending ||
      !termsChanged ||
      cleaned.some((term) => !term) ||
      new Set(cleaned.map((term) => term.toLowerCase())).size !==
        cleaned.length
    ) {
      setError("Enter unique, non-empty tracking terms.");
      return;
    }

    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await updateSubjectTrackingTerms({
        subjectId: subject.id,
        trackingTerms: cleaned.map((term, position) => ({
          name: term,
          position,
        })),
      });

      if (showResult(result)) {
        // Refresh the page to load the saved tracking terms.
        router.refresh();
      }
    });
  }

  function saveBatches() {
    if (isPending || !batchesChanged) return;

    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await updateSubjectBatches({
        subjectId: subject.id,
        batchIds: selectedBatchIds,
      });

      if (showResult(result)) router.refresh();
    });
  }

  function toggleBatch(batchId: string) {
    setSelectedBatchIds((current) =>
      current.includes(batchId)
        ? current.filter((id) => id !== batchId)
        : [...current, batchId],
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Update Subject</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Save each section independently.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {message && (
        <div role="status" className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm">
          {message}
        </div>
      )}

      {/* Subject name */}
      <section className="space-y-3 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Subject Name</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm"
            placeholder="Subject name"
          />
          <button
            type="button"
            onClick={saveName}
            disabled={isPending || !nameChanged || !name.trim()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Name
          </button>
        </div>
      </section>

      {/* Subject parts */}
      <section className="space-y-4 rounded-xl border bg-card p-5">
        <div>
          <h2 className="font-semibold">Subject Parts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Rename or explicitly delete an existing part.
          </p>
        </div>

        {parts.length === 0 && (
          <p className="text-sm text-muted-foreground">No parts found.</p>
        )}

        {parts.map((part, index) => {
          const original = subject.parts.find((item) => item.id === part.id);
          const changed = part.name.trim() !== (original?.name ?? "");

          return (
            <div key={part.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <input
                value={part.name}
                onChange={(e) =>
                  setParts((current) =>
                    current.map((item) =>
                      item.id === part.id
                        ? { ...item, name: e.target.value }
                        : item,
                    ),
                  )
                }
                disabled={isPending}
                className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => savePart(part)}
                  disabled={isPending || !changed || !part.name.trim()}
                  className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-40"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => removePart(part)}
                  disabled={isPending}
                  aria-label={`Delete ${part.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Tracking terms */}
      <section className="space-y-4 rounded-xl border bg-card p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold">Tracking Terms</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Changes are saved together.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTrackingTerms((current) => [...current, ""])}
            disabled={isPending}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm hover:bg-muted disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Add Term
          </button>
        </div>

        {trackingTerms.map((term, index) => (
          <div key={index} className="flex items-center gap-2 rounded-lg border p-2">
            <span className="w-7 text-center text-sm text-muted-foreground">
              {index + 1}
            </span>
            <input
              value={term}
              onChange={(e) =>
                setTrackingTerms((current) =>
                  current.map((item, i) => (i === index ? e.target.value : item)),
                )
              }
              disabled={isPending}
              placeholder="Tracking term"
              className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm"
            />
            <button
              type="button"
              onClick={() =>
                setTrackingTerms((current) =>
                  current.filter((_, i) => i !== index),
                )
              }
              disabled={isPending}
              aria-label={`Remove tracking term ${index + 1}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={saveTerms}
            disabled={isPending || !termsChanged}
            className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            Save Tracking Terms
          </button>
        </div>
      </section>

      {/* Batch assignments */}
      <section className="space-y-4 rounded-xl border bg-card p-5">
        <div>
          <h2 className="font-semibold">Assigned Batches</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select the batches that should use this subject.
          </p>
        </div>

        {branches.map((branch) => (
          <div key={branch.id} className="overflow-hidden rounded-lg border">
            <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">
              {branch.name}
            </div>
            {branch.batches.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                No batches in this branch.
              </p>
            ) : (
              <div className="grid gap-2 p-3 sm:grid-cols-2">
                {branch.batches.map((batch) => {
                  const selected = selectedBatchIds.includes(batch.id);
                  return (
                    <label
                      key={batch.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={isPending}
                        onChange={() => toggleBatch(batch.id)}
                      />
                      <span>{batch.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {selectedBatchIds.length} selected
          </span>
          <button
            type="button"
            onClick={saveBatches}
            disabled={isPending || !batchesChanged}
            className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            Save Batches
          </button>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => router.replace("/admin/subjects")}
          disabled={isPending}
          className="h-10 rounded-lg border px-5 text-sm font-medium hover:bg-muted disabled:opacity-40"
        >
          Back to Subjects
        </button>
      </div>
    </div>
  );
}
