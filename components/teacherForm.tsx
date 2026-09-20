"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";

import {
  useForm,
  type DefaultValues,
} from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  BookOpen,
  User,
  Mail,
  Phone,
  GraduationCap,
} from "lucide-react";

import {
  CreateSchemaTeacher,
  EditSchemaTeacher,
  type FormStateTeacher,
} from "@/app/ServerActions/auth/Validate";

import {
  TEACHER_FIELD_PERMISSIONS,
  type EditorRole,
} from "@/app/ServerActions/auth/teacher-permissions";

import { PasswordInput } from "@/components/passwordInput";
import BatchSelector from "@/components/BatchSelector";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";

/* =========================================================
   TYPES
========================================================= */

export type FormMode = "create" | "edit";

export type Subject = {
  id: string;
  name: string;
};

export type BatchSubject = {
  id: string;
  batchId: string;
  subjectId: string;
  subject: Subject;
};

export type Batch = {
  id: string;
  name: string;
  branchId: string;
  subjects: BatchSubject[];
};

export type Branch = {
  id: string;
  name: string;
  batches: Batch[];
};

export type TeacherFormValues = {
  userId?: string;

  name: string;
  email: string;
  phone: string;

  password: string;
  confirmPassword: string;

  branchIds: string[];
  batchIds: string[];
  subjectIds: string[];
};

export type TeacherFormUser = {
  id: string;

  name: string;
  email: string | null;
  phone: string | null;

  branchIds: string[];
  batchIds: string[];
  subjectIds: string[];
};

type TeacherFormAction = (
  prevState: FormStateTeacher,
  formData: FormData,
) => Promise<FormStateTeacher>;

type TeacherFormProps = {
  mode: FormMode;
  editorRole: EditorRole;
  action: TeacherFormAction;
  branches: Branch[];
  user?: TeacherFormUser;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function TeacherForm({
  mode,
  editorRole,
  action,
  branches,
  user,
}: TeacherFormProps) {
  const isEdit = mode === "edit";

  const permissions =
    TEACHER_FIELD_PERMISSIONS[editorRole];

  /* =======================================================
     SERVER ACTION
  ======================================================= */

  const [state, formAction, pending] =
    useActionState<FormStateTeacher, FormData>(
      action,
      {},
    );

  /* =======================================================
     SCHEMA
  ======================================================= */

  const schema = isEdit
    ? EditSchemaTeacher
    : CreateSchemaTeacher;

  /* =======================================================
     FORM
  ======================================================= */

  const {
    register,
    setValue,
    reset,
    trigger,
    watch,
    formState: {
      errors,
      isValid,
    },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(schema) as never,

    mode: "onChange",
    reValidateMode: "onChange",

    defaultValues: {
      userId: user?.id ?? "",

      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",

      password: "",
      confirmPassword: "",

      branchIds: user?.branchIds ?? [],
      batchIds: user?.batchIds ?? [],
      subjectIds: user?.subjectIds ?? [],
    } as DefaultValues<TeacherFormValues>,
  });

  /* =======================================================
     LOCAL BRANCH SELECTION STATE
  ======================================================= */

  const [
    selectedBranchIds,
    setSelectedBranchIds,
  ] = useState<string[]>(
    user?.branchIds ?? [],
  );

  /* =======================================================
     RESET EDIT DATA
  ======================================================= */

  useEffect(() => {
    if (!user) return;

    const branchIds = user.branchIds ?? [];
    const batchIds = user.batchIds ?? [];
    const subjectIds = user.subjectIds ?? [];

    setSelectedBranchIds(branchIds);

    reset({
      userId: user.id,

      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",

      password: "",
      confirmPassword: "",

      branchIds,
      batchIds,
      subjectIds,
    });

    // Recalculate Zod/RHF validity after loading edit values.
    void trigger();
  }, [user, reset, trigger]);

  /* =======================================================
     WATCH
  ======================================================= */

  const selectedBatchIds =
    watch("batchIds") ?? [];

  const selectedSubjectIds =
    watch("subjectIds") ?? [];

  /* =======================================================
     LOOKUPS
  ======================================================= */

  const branchesById = useMemo(
    () =>
      new Map(
        branches.map((branch) => [
          branch.id,
          branch,
        ]),
      ),
    [branches],
  );

  const allBatches = useMemo(
    () =>
      branches.flatMap(
        (branch) => branch.batches,
      ),
    [branches],
  );

  const batchesById = useMemo(
    () =>
      new Map(
        allBatches.map((batch) => [
          batch.id,
          batch,
        ]),
      ),
    [allBatches],
  );

  /* =======================================================
     SELECTED BRANCH NAMES
  ======================================================= */

  const selectedBranchNames = useMemo(
    () =>
      selectedBranchIds
        .map(
          (id) =>
            branchesById.get(id)?.name,
        )
        .filter(
          (name): name is string =>
            Boolean(name),
        ),
    [selectedBranchIds, branchesById],
  );

  /* =======================================================
     SELECTED BATCH NAMES
  ======================================================= */

  const selectedBatchNames = useMemo(
    () =>
      selectedBatchIds
        .map(
          (id) =>
            batchesById.get(id)?.name,
        )
        .filter(
          (name): name is string =>
            Boolean(name),
        ),
    [selectedBatchIds, batchesById],
  );

  /* =======================================================
     AVAILABLE SUBJECTS

     Union of subjects across selected batches.
  ======================================================= */

  const availableSubjects = useMemo(() => {
    const subjectMap =
      new Map<string, Subject>();

    for (const batchId of selectedBatchIds) {
      const batch =
        batchesById.get(batchId);

      if (!batch) continue;

      for (const batchSubject of batch.subjects) {
        subjectMap.set(
          batchSubject.subject.id,
          batchSubject.subject,
        );
      }
    }

    return Array.from(subjectMap.values());
  }, [
    selectedBatchIds,
    batchesById,
  ]);

  /* =======================================================
     SELECTED SUBJECTS
  ======================================================= */

  const selectedSubjects = useMemo(
    () =>
      availableSubjects.filter(
        (subject) =>
          selectedSubjectIds.includes(
            subject.id,
          ),
      ),
    [
      availableSubjects,
      selectedSubjectIds,
    ],
  );

  /* =======================================================
     PRUNE STALE SUBJECTS

     Only roles allowed to edit subjects can
     modify the selection.

     Existing subject selections remain untouched
     for read-only roles.
  ======================================================= */

  useEffect(() => {
    if (!permissions.subjects) {
      return;
    }

    const availableIds = new Set(
      availableSubjects.map(
        (subject) => subject.id,
      ),
    );

    const validSubjectIds =
      selectedSubjectIds.filter(
        (id) => availableIds.has(id),
      );

    if (
      validSubjectIds.length !==
      selectedSubjectIds.length
    ) {
      setValue(
        "subjectIds",
        validSubjectIds,
        {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        },
      );
    }
  }, [
    availableSubjects,
    selectedSubjectIds,
    setValue,
    permissions.subjects,
  ]);

  /* =======================================================
     COMBOBOX
  ======================================================= */

  const subjectAnchor =
    useComboboxAnchor();

  /* =======================================================
     READ-ONLY STYLING
  ======================================================= */

  const readOnlyClass =
    "cursor-not-allowed bg-muted/60 text-muted-foreground";

  const fieldClass = (
    base: string,
    editable: boolean,
  ) =>
    editable
      ? base
      : `${base} ${readOnlyClass}`;

  /* =======================================================
     TEXT
  ======================================================= */

  const pageTitle = isEdit
    ? "Edit Teacher"
    : "Register New Teacher";

  const pageDescription = isEdit
    ? "Update teacher details."
    : "Fill in the teacher's details.";

  const submitText = isEdit
    ? "Update Teacher"
    : "Create Teacher";

  const pendingText = isEdit
    ? "Updating Teacher..."
    : "Creating Teacher...";

  const successText = isEdit
    ? "Teacher updated successfully."
    : "Teacher registered successfully.";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Card className="col-span-12 overflow-visible border-border shadow-xl">
      <CardContent className="overflow-visible p-6 sm:p-8 lg:p-10">

        {/* HEADER */}

        <div className="mb-8 flex flex-col items-center text-center sm:mb-10">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg sm:h-20 sm:w-20">
            <BookOpen className="h-8 w-8 text-primary-foreground sm:h-10 sm:w-10" />
          </div>

          <h1 className="text-2xl font-bold text-card-foreground sm:text-3xl">
            {pageTitle}
          </h1>

          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {pageDescription}
          </p>

          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground ring-1 ring-border">
            <GraduationCap className="h-3.5 w-3.5" />
            Role: Teacher
          </span>
        </div>

        <form
          action={formAction}
          className="space-y-6"
        >
          {/* ROLE */}

          <input
            type="hidden"
            name="role"
            value="TEACHER"
          />

          {/* USER ID */}

          {isEdit && (
            <input
              type="hidden"
              {...register("userId")}
            />
          )}

          {/* =================================================
              NAME
          ================================================= */}

          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="font-medium text-foreground"
            >
              Full Name{" "}
              <span className="text-destructive">
                *
              </span>
            </Label>

            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="name"
                readOnly={!permissions.name}
                aria-disabled={!permissions.name}
                {...register("name")}
                placeholder="Enter full name"
                className={fieldClass(
                  "h-12 rounded-xl border-input bg-background pl-10 transition-all focus:border-ring focus:ring-2 focus:ring-ring/20",
                  permissions.name,
                )}
              />
            </div>

            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* =================================================
              EMAIL + PHONE
          ================================================= */}

          <div className="grid gap-6 sm:grid-cols-2">

            {/* EMAIL */}

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="font-medium text-foreground"
              >
                Email Address{" "}
                <span className="text-destructive">
                  *
                </span>
              </Label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="email"
                  type="email"
                  readOnly={!permissions.email}
                  aria-disabled={!permissions.email}
                  {...register("email")}
                  placeholder="teacher@alkitaab.com"
                  className={fieldClass(
                    "h-12 rounded-xl border-input bg-background pl-10 transition-all focus:border-ring focus:ring-2 focus:ring-ring/20",
                    permissions.email,
                  )}
                />
              </div>

              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* PHONE */}

            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="font-medium text-foreground"
              >
                Phone Number{" "}
                <span className="text-destructive">
                  *
                </span>
              </Label>

              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="phone"
                  type="tel"
                  readOnly={!permissions.phone}
                  aria-disabled={!permissions.phone}
                  {...register("phone")}
                  placeholder="e.g. 9876543210"
                  className={fieldClass(
                    "h-12 rounded-xl border-input bg-background pl-10 transition-all focus:border-ring focus:ring-2 focus:ring-ring/20",
                    permissions.phone,
                  )}
                />
              </div>

              {errors.phone && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          {/* =================================================
              PASSWORD
          ================================================= */}

          <div className="grid gap-6 sm:grid-cols-2">

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="font-medium text-foreground"
              >
                Password{" "}
                {!isEdit && (
                  <span className="text-destructive">
                    *
                  </span>
                )}
              </Label>

              <PasswordInput
                id="password"
                readOnly={!permissions.password}
                aria-disabled={!permissions.password}
                {...register("password", {
                  onChange: () => {
                    void trigger("password");
                    void trigger("confirmPassword");
                  },
                })}
                placeholder={
                  isEdit
                    ? "Leave blank to keep current password"
                    : "Enter password"
                }
                required={!isEdit}
                className={fieldClass(
                  "border-input",
                  permissions.password,
                )}
              />

              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="font-medium text-foreground"
              >
                Confirm Password{" "}
                {!isEdit && (
                  <span className="text-destructive">
                    *
                  </span>
                )}
              </Label>

              <PasswordInput
                id="confirmPassword"
                readOnly={!permissions.password}
                aria-disabled={!permissions.password}
                {...register("confirmPassword")}
                placeholder={
                  isEdit
                    ? "Leave blank to keep current password"
                    : "Confirm password"
                }
                required={!isEdit}
                className={fieldClass(
                  "border-input",
                  permissions.password,
                )}
              />

              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* =================================================
              BRANCHES + BATCHES
          ================================================= */}

          <div className="space-y-2">
            <Label className="font-medium text-foreground">
              Branches &amp; Batches{" "}
              <span className="text-destructive">
                *
              </span>
            </Label>

            {permissions.batches ? (
              <BatchSelector
                branches={branches}
                selectedBranchIds={selectedBranchIds}
                onBranchChange={(ids) => {
                  setSelectedBranchIds(ids);

                  setValue(
                    "branchIds",
                    ids,
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    },
                  );
                }}
                selectedBatchIds={selectedBatchIds}
                onBatchChange={(ids) => {
                  setValue(
                    "batchIds",
                    ids,
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    },
                  );
                }}
              />
            ) : (
              <div className="space-y-2">

                {/* READ-ONLY BRANCHES */}

                <div
                  aria-disabled="true"
                  className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-input bg-muted/60 px-4 py-3 text-muted-foreground"
                >
                  {selectedBranchNames.length > 0 ? (
                    selectedBranchNames.map(
                      (name) => (
                        <Badge
                          key={name}
                          variant="secondary"
                          className="rounded-full"
                        >
                          {name}
                        </Badge>
                      ),
                    )
                  ) : (
                    <span className="text-sm">
                      No branches assigned
                    </span>
                  )}
                </div>

                {/* READ-ONLY BATCHES */}

                <div
                  aria-disabled="true"
                  className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-input bg-muted/60 px-4 py-3 text-muted-foreground"
                >
                  {selectedBatchNames.length > 0 ? (
                    selectedBatchNames.map(
                      (name) => (
                        <Badge
                          key={name}
                          variant="secondary"
                          className="rounded-full"
                        >
                          {name}
                        </Badge>
                      ),
                    )
                  ) : (
                    <span className="text-sm">
                      No batches assigned
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ALWAYS SUBMIT BRANCH IDS */}

            <input
              type="hidden"
              name="branchIds"
              value={JSON.stringify(
                selectedBranchIds,
              )}
            />

            {/* ALWAYS SUBMIT BATCH IDS */}

            <input
              type="hidden"
              name="batchIds"
              value={JSON.stringify(
                selectedBatchIds,
              )}
              readOnly
            />

            {errors.branchIds && (
              <p className="text-sm text-destructive">
                {String(
                  errors.branchIds.message,
                )}
              </p>
            )}

            {errors.batchIds && (
              <p className="text-sm text-destructive">
                {String(
                  errors.batchIds.message,
                )}
              </p>
            )}
          </div>

          {/* =================================================
              SUBJECTS
          ================================================= */}

          <div className="space-y-3">
            <div>
              <Label className="font-medium text-foreground">
                Subjects
              </Label>

              <p className="mt-1 text-sm text-muted-foreground">
                Choose the subjects this teacher should use.
              </p>
            </div>

            {permissions.subjects ? (
              <>
                {/* NO BATCH */}

                {selectedBatchIds.length === 0 && (
                  <div className="flex h-12 items-center rounded-xl border border-dashed border-border bg-muted px-4 text-sm text-muted-foreground">
                    Select a batch to choose subjects.
                  </div>
                )}

                {/* NO SUBJECTS */}

                {selectedBatchIds.length > 0 &&
                  availableSubjects.length === 0 && (
                    <div className="flex h-12 items-center rounded-xl border border-dashed border-border bg-muted px-4 text-sm text-muted-foreground">
                      No subjects are available for the selected batches.
                    </div>
                  )}

                {/* SUBJECT SELECTOR */}

                {availableSubjects.length > 0 && (
                  <Combobox
                    items={availableSubjects}
                    multiple
                    value={selectedSubjects}
                    onValueChange={(items: Subject[]) => {
                      setValue(
                        "subjectIds",
                        items.map(
                          (subject) => subject.id,
                        ),
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        },
                      );
                    }}
                    itemToStringValue={(
                      subject: Subject,
                    ) => subject.name}
                  >
                    <ComboboxChips
                      ref={subjectAnchor}
                      className="min-h-12 overflow-y-auto rounded-xl border-input bg-background px-3 py-2 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20"
                    >
                      <ComboboxValue>
                        {selectedSubjects.map(
                          (subject) => (
                            <ComboboxChip
                              key={subject.id}
                              className="gap-1.5 rounded-full border-primary/30 bg-primary/10 pl-3 pr-1.5 text-primary"
                            >
                              {subject.name}
                            </ComboboxChip>
                          ),
                        )}
                      </ComboboxValue>

                      <ComboboxChipsInput
                        placeholder={
                          selectedSubjects.length === 0
                            ? "Select subjects..."
                            : ""
                        }
                      />
                    </ComboboxChips>

                    <ComboboxContent
                      anchor={subjectAnchor}
                      className="rounded-xl"
                    >
                      <ComboboxEmpty>
                        No subjects found.
                      </ComboboxEmpty>

                      <ComboboxList>
                        <ComboboxCollection>
                          {(subject: Subject) => (
                            <ComboboxItem
                              key={subject.id}
                              value={subject}
                            >
                              {subject.name}
                            </ComboboxItem>
                          )}
                        </ComboboxCollection>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                )}
              </>
            ) : (
              /* =================================================
                 READ-ONLY SUBJECTS
              ================================================= */

              <div
                aria-disabled="true"
                className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-input bg-muted/60 px-4 py-3 text-muted-foreground"
              >
                {selectedSubjects.length > 0 ? (
                  selectedSubjects.map(
                    (subject) => (
                      <Badge
                        key={subject.id}
                        variant="secondary"
                        className="rounded-full"
                      >
                        {subject.name}
                      </Badge>
                    ),
                  )
                ) : (
                  <span className="text-sm">
                    No subjects assigned
                  </span>
                )}
              </div>
            )}

            {/* ALWAYS SUBMIT SUBJECT IDS */}

            <input
              type="hidden"
              name="subjectIds"
              value={JSON.stringify(
                selectedSubjectIds,
              )}
              readOnly
            />

            {errors.subjectIds && (
              <p className="text-sm text-destructive">
                {String(
                  errors.subjectIds.message,
                )}
              </p>
            )}
          </div>

          {/* =================================================
              SUCCESS
          ================================================= */}

          {state?.success && (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
              <p className="text-sm font-medium text-green-600">
                {successText}
              </p>
            </div>
          )}

          {/* =================================================
              SERVER ERRORS
          ================================================= */}

          {state?.errors && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
              {Object.entries(state.errors).map(
                ([key, value]) => (
                  <p
                    key={key}
                    className="text-sm text-destructive"
                  >
                    {Array.isArray(value)
                      ? value[0]
                      : value}
                  </p>
                ),
              )}
            </div>
          )}

          {state?.message && (
            <p className="text-sm text-destructive">
              {state.message}
            </p>
          )}

          {/* =================================================
              SUBMIT
          ================================================= */}

          <Button
            type="submit"
            disabled={pending || !isValid}
            className="
              h-12
              w-full
              rounded-xl
              bg-primary
              text-base
              font-semibold
              shadow-sm
              transition-all
              text-primary-foreground
              hover:bg-primary/90
              hover:shadow-md
              active:scale-[0.99]
              disabled:pointer-events-none
              disabled:opacity-50
            "
          >
            {pending
              ? pendingText
              : submitText}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}