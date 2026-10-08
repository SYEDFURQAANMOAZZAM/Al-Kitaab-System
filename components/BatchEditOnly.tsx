"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

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
  initialName?: string;
  subjects: BatchSubjectOption[];
  assignedSubjectIds?: string[];
  action: BatchAction;
  role: "admin" | "teacher";
};

const initialState: GroupActionState = undefined;

export default function BatchForm({
  initialName = "",
  subjects,
  assignedSubjectIds = [],
  action,
  role,
}: BatchFormProps) {
  const router = useRouter();

  const isAdmin = role === "admin";

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
  }, [
    state,
    name,
    selectedSubjectIds,
    router,
  ]);

  function toggleSubject(subjectId: string) {
    if (!isAdmin) return;

    setSelectedSubjectIds((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId]
    );
  }

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
          disabled={!isAdmin || pending}
          required
          maxLength={100}
          className="disabled:bg-background disabled:text-foreground disabled:opacity-100"
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
        </p>

        {subjects.length === 0 ? (
          <div className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">
            No subjects available.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-2">
            {subjects.map((subject) => {
              const checked =
                selectedSubjectIds.includes(subject.id);

              return (
                <label
                  key={subject.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-transparent p-3 transition-colors hover:bg-muted"
                >
                  <span className="relative flex size-4 shrink-0 items-center justify-center">
                    <input
                      type="checkbox"
                      name="subjectIds"
                      value={subject.id}
                      checked={checked}
                      onChange={() =>
                        toggleSubject(subject.id)
                      }
                      disabled={!isAdmin || pending}
                      className="peer absolute inset-0 z-10 size-4 cursor-pointer appearance-none rounded-sm border border-input bg-background checked:border-primary checked:bg-primary disabled:cursor-default disabled:opacity-100"
                    />

                    {checked && (
                      <svg
                        viewBox="0 0 12 12"
                        fill="none"
                        className="pointer-events-none relative z-20 size-3 text-primary-foreground"
                        aria-hidden="true"
                      >
                        <path
                          d="M2.5 6L5 8.5L9.5 3.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>

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
      {isAdmin && (
        <div className="flex justify-end border-t pt-4">
          <button
            type="submit"
            disabled={pending || !hasChanges}
            className={buttonVariants()}
          >
            {pending ? "Updating..." : "Update Batch"}
          </button>
        </div>
      )}
    </form>
  );
}