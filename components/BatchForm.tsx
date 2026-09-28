
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import type {
  BatchSubjectOption,
  GroupActionState,
} from "@/app/ServerActions/batchOperations/types/batch.types";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";

type BatchAction = (
  state: GroupActionState,
  formData: FormData
) => Promise<GroupActionState>;

type BatchFormProps = {
  mode: "create" | "edit";
  branchId: string;
  initialName?: string;
  subjects: BatchSubjectOption[];
  assignedSubjectIds?: string[];
  action: BatchAction;
};

const initialState: GroupActionState = undefined;

export default function BatchForm({
  mode,
  initialName = "",
  subjects,
  assignedSubjectIds = [],
  action,
}: BatchFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [selectedSubjectIds, setSelectedSubjectIds] =
    useState<string[]>(assignedSubjectIds);

  const [savedName, setSavedName] = useState(initialName);
  const [savedSubjectIds, setSavedSubjectIds] =
    useState<string[]>(assignedSubjectIds);

  const [state, formAction, pending] = useActionState(
    action,
    initialState
  );

  const handledState = useRef<GroupActionState>(undefined);

  const isEdit = mode === "edit";

  const subjectsChanged =
    selectedSubjectIds.length !== savedSubjectIds.length ||
    selectedSubjectIds.some(
      (id) => !savedSubjectIds.includes(id)
    );

  const nameChanged = name.trim() !== savedName.trim();
  const hasChanges = nameChanged || subjectsChanged;

  useEffect(() => {
    if (
      !state?.success ||
      handledState.current === state
    ) {
      return;
    }

    handledState.current = state;

    setSavedName(name);
    setSavedSubjectIds([...selectedSubjectIds]);

    router.refresh();
  }, [state, name, selectedSubjectIds, router]);

  function toggleSubject(subjectId: string) {
    setSelectedSubjectIds((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId]
    );
  }

  const backHref = `/admin/branches`;

  return (
    <form action={formAction} className="space-y-6">
      {/* Batch Name */}
      <div className="space-y-2">
        <Label htmlFor="batchName">
          Batch Name
        </Label>

        <Input
          id="batchName"
          name="batchName"
          placeholder="Enter batch name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
          required
          maxLength={100}
        />
      </div>

      {/* Subjects */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label>Subjects</Label>

          <span className="text-sm text-muted-foreground">
            {selectedSubjectIds.length} selected
          </span>
        </div>

        <p className="text-sm text-muted-foreground">
          Select the subjects to be taught in this batch.
          Subject assignment is optional and can be
          updated later.
        </p>

        {subjects.length === 0 ? (
          <div className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">
            No subjects available. You can still
            {isEdit ? " update" : " create"} this batch.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-2">
            {subjects.map((subject) => {
              const checked = selectedSubjectIds.includes(
                subject.id
              );

              return (
                <label
                  key={subject.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:bg-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="subjectIds"
                    value={subject.id}
                    checked={checked}
                    onChange={() => toggleSubject(subject.id)}
                    disabled={pending}
                    className="size-4 accent-primary"
                  />

                  <span className="text-sm font-medium">
                    {subject.name}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Server Response */}
      {state?.error && (
        <p
          className="text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      )}

      {state?.success && (
        <p
          className="text-sm text-green-600"
          role="status"
        >
          {state.success}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse justify-end gap-3 border-t pt-4 sm:flex-row">
        <Link
          href={backHref}
          aria-disabled={pending}
          tabIndex={pending ? -1 : undefined}
          className={`${buttonVariants({
            variant: "outline",
          })} ${
            pending
              ? "pointer-events-none opacity-50"
              : ""
          }`}
        >
          Cancel
        </Link>

        {isEdit ? (
          <button
            type="submit"
            disabled={pending || !hasChanges}
            className={buttonVariants()}
          >
            {pending ? "Updating..." : "Update Batch"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending || !name.trim()}
            className={buttonVariants()}
          >
            {pending ? "Saving..." : "Save Batch"}
          </button>
        )}
      </div>
    </form>
  );
}
