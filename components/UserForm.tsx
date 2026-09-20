"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  STUDENT_FIELD_PERMISSIONS,
  type EditorRole,
} from "@/app/ServerActions/auth/student-permissions";
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
  CreateSchemaStudent,
  EditSchemaStudent,
} from "@/app/ServerActions/auth/Validate";

import { PasswordInput } from "@/components/passwordInput";
import BatchSelector from "./BatchSelector";

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



export type Subject = { id: string; name: string };

export type BatchSubject = {
  id: string;
  batchId: string;
  subjectId: string;
  subject: Subject;
};

export type Batch = { id: string; name: string; subjects: BatchSubject[] };

export type Branch = { id: string; name: string; batches: Batch[] };

export type StudentFormValues = {
  userId?: string;
  name: string;
  email: string;
  phone: string;
  phone2: string;
  fatherName: string;
  address: string;
  password: string;
  confirmPassword: string;
  batchIds: string[];
  subjectIds: string[];
};

export type StudentFormState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string | string[]>;
};

type StudentFormAction = (
  prevState: StudentFormState,
  formData: FormData
) => Promise<StudentFormState>;

type StudentFormUser = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  phone2?: string | null;
  fatherName?: string | null;
  address?: string | null;
  batchIds?: string[];
  subjectIds?: string[];
};

type StudentFormProps = {
  mode: FormMode;
  editorRole: EditorRole;
  action: StudentFormAction;
  branches: Branch[];
  user?: StudentFormUser;
};


/* =========================================================
   FIELD PERMISSIONS SCHEMA

   Single source of truth for which fields each editor role may
   EDIT on a student record. `true` = editable, `false` = shown
   but read-only (rendered "disabled" in the UI).

   Client-side only — controls rendering, not authorization.
   The server action must re-derive the real actor role from the
   authenticated session and enforce the same rules there,
   ignoring/overwriting any value submitted for a field that
   role isn't allowed to change.
========================================================= */

export type StudentField =
  | "name"
  | "fatherName"
  | "address"
  | "email"
  | "phone"
  | "phone2"
  | "password"
  | "batches"
  | "subjects";

export type FieldPermissions = Record<StudentField, boolean>;




/* =========================================================
   COMPONENT
========================================================= */

export default function StudentForm({
  mode,
  editorRole,
  action,
  branches,
  user,
}: StudentFormProps) {
  const isEdit = mode === "edit";

  const permissions = STUDENT_FIELD_PERMISSIONS[editorRole];

  const [state, formAction, pending] = useActionState(action, {});

  

  const schema = isEdit ? EditSchemaStudent : CreateSchemaStudent;

  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

  const {
    register,
    setValue,
    reset,
    trigger,
    watch,
    formState: { errors, isValid },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(schema) as never,
    mode: "onChange",
    defaultValues: {
      userId: user?.id ?? "",
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      phone2: user?.phone2 ?? "",
      fatherName: user?.fatherName ?? "",
      address: user?.address ?? "",
      password: "",
      confirmPassword: "",
      batchIds: user?.batchIds ?? [],
      subjectIds: user?.subjectIds ?? [],
    } as DefaultValues<StudentFormValues>,
  });

  useEffect(() => {
    if (!user) return;

    const userBatchIds = user.batchIds ?? [];

    const derivedBranchIds = branches
      .filter((branch) =>
        branch.batches.some((batch) => userBatchIds.includes(batch.id))
      )
      .map((branch) => branch.id);

    setSelectedBranchIds(derivedBranchIds);

    reset({
      userId: user.id ?? "",
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      phone2: user.phone2 ?? "",
      fatherName: user.fatherName ?? "",
      address: user.address ?? "",
      password: "",
      confirmPassword: "",
      batchIds: userBatchIds,
      subjectIds: user.subjectIds ?? [],
    });
  }, [user, branches, reset]);

  const selectedBatchIds = watch("batchIds") ?? [];
  const selectedSubjectIds = watch("subjectIds") ?? [];

  const allBatches = useMemo(
    () => branches.flatMap((branch) => branch.batches),
    [branches]
  );

  const batchesById = useMemo(
    () => new Map(allBatches.map((batch) => [batch.id, batch])),
    [allBatches]
  );

  const selectedBatchNames = useMemo(
    () =>
      selectedBatchIds
        .map((id) => batchesById.get(id)?.name)
        .filter((name): name is string => Boolean(name)),
    [selectedBatchIds, batchesById]
  );

  const availableSubjects = useMemo(() => {
    const subjectMap = new Map<string, Subject>();

    for (const batchId of selectedBatchIds) {
      const batch = batchesById.get(batchId);
      if (!batch) continue;

      for (const batchSubject of batch.subjects) {
        subjectMap.set(batchSubject.subject.id, batchSubject.subject);
      }
    }

    return Array.from(subjectMap.values());
  }, [selectedBatchIds, batchesById]);

  const selectedSubjects = useMemo(
    () =>
      availableSubjects.filter((subject) =>
        selectedSubjectIds.includes(subject.id)
      ),
    [availableSubjects, selectedSubjectIds]
  );

  useEffect(() => {
    // Only auto-prune stale pattern selections when patterns are
    // actually editable — a read-only view should keep showing
    // whatever the student already has, unmodified.
    if (!permissions.subjects) return;

    const availableIds = new Set(availableSubjects.map((subject) => subject.id));
    const validSubjectIds = selectedSubjectIds.filter((id) =>
      availableIds.has(id)
    );

    if (validSubjectIds.length !== selectedSubjectIds.length) {
      setValue("subjectIds", validSubjectIds, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  }, [availableSubjects, selectedSubjectIds, setValue, permissions.subjects]);

  const subjectAnchor = useComboboxAnchor();

  const pageTitle = isEdit ? "Edit Student" : "Register New Student";
  const pageDescription = isEdit
    ? "Update the student's details."
    : "Fill in the student's details.";
  const submitText = isEdit ? "Update Student" : "Create Student";
  const pendingText = isEdit ? "Updating Student..." : "Creating Student...";
    const successText = isEdit
    ? "Student updated successfully."
    : "Student registered successfully.";
  // Visual treatment for a field this actor role can't edit.
  // NOTE: we use `readOnly`, not the native `disabled` attribute,
  // on text-type inputs. Disabled form fields are excluded from
  // FormData on submit, which would silently drop the student's
  // existing value (e.g. their father's name) when a restricted
  // actor submits the form. `readOnly` blocks editing while still
  // submitting the field's current value.
  const readOnlyClass = "cursor-not-allowed bg-muted/60 text-muted-foreground";
  const fieldClass = (base: string, editable: boolean) =>
    editable ? base : `${base} ${readOnlyClass}`;

  return (
    <Card className="col-span-12 overflow-visible border-border shadow-xl">
      <CardContent className="overflow-visible p-6 sm:p-8 lg:p-10">
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
            Role: Student
          </span>
        </div>

        {/*
          IMPORTANT: `editorRole` is intentionally NOT sent as a
          hidden input. It only drives which fields render as
          editable vs. read-only. The server action must derive
          the real actor role from the authenticated session,
          never from FormData — and must ignore/overwrite any
          value submitted for a field that role can't edit,
          since a tampered client could still send one.
        */}
        <form action={formAction} className="space-y-6">
          {isEdit && <input type="hidden" {...register("userId")} />}

          {/* NAME */}
          <div className="space-y-2">
            <Label htmlFor="name" className="font-medium text-foreground">
              Full Name <span className="text-destructive">*</span>
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
                  permissions.name
                )}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* FATHER'S NAME */}
          <div className="space-y-2">
            <Label htmlFor="fatherName" className="font-medium text-foreground">
              Father&apos;s Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fatherName"
              readOnly={!permissions.fatherName}
              aria-disabled={!permissions.fatherName}
              {...register("fatherName")}
              placeholder="Enter father's name"
              className={fieldClass(
                "h-12 rounded-xl border-input bg-background transition-all focus:border-ring focus:ring-2 focus:ring-ring/20",
                permissions.fatherName
              )}
            />
            {errors.fatherName && (
              <p className="text-sm text-destructive">
                {errors.fatherName.message}
              </p>
            )}
          </div>

          {/* ADDRESS */}
          <div className="space-y-2">
            <Label htmlFor="address" className="font-medium text-foreground">
              Address <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="address"
              readOnly={!permissions.address}
              aria-disabled={!permissions.address}
              {...register("address")}
              placeholder="Enter address"
              rows={3}
              className={fieldClass(
                "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20",
                permissions.address
              )}
            />
            {errors.address && (
              <p className="text-sm text-destructive">
                {errors.address.message}
              </p>
            )}
          </div>

          {/* EMAIL */}
          <div className="space-y-2">
            <Label htmlFor="email" className="font-medium text-foreground">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                readOnly={!permissions.email}
                aria-disabled={!permissions.email}
                {...register("email")}
                placeholder="user@alkitaab.com"
                className={fieldClass(
                  "h-12 rounded-xl border-input bg-background pl-10 transition-all focus:border-ring focus:ring-2 focus:ring-ring/20",
                  permissions.email
                )}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* PHONE + PHONE 2 */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-medium text-foreground">
                Phone Number <span className="text-destructive">*</span>
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
                    permissions.phone
                  )}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone2" className="font-medium text-foreground">
                Phone Number 2
              </Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone2"
                  type="tel"
                  readOnly={!permissions.phone2}
                  aria-disabled={!permissions.phone2}
                  {...register("phone2")}
                  placeholder="Optional alternate phone number"
                  className={fieldClass(
                    "h-12 rounded-xl border-input bg-background pl-10 transition-all focus:border-ring focus:ring-2 focus:ring-ring/20",
                    permissions.phone2
                  )}
                />
              </div>
              {errors.phone2 && (
                <p className="text-sm text-destructive">
                  {errors.phone2.message}
                </p>
              )}
            </div>
          </div>

          {/* PASSWORD */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password" className="font-medium text-foreground">
                Password{" "}
                {!isEdit && <span className="text-destructive">*</span>}
              </Label>
              <PasswordInput
                id="password"
                readOnly={!permissions.password}
                aria-disabled={!permissions.password}
                {...register("password", {
                  onChange: () => trigger("confirmPassword"),
                })}
                placeholder={
                  isEdit ? "Leave blank to keep current password" : "Enter password"
                }
                required={!isEdit}
                className={fieldClass("border-input", permissions.password)}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-medium text-foreground">
                Confirm Password{" "}
                {!isEdit && <span className="text-destructive">*</span>}
              </Label>
              <PasswordInput
                id="confirmPassword"
                readOnly={!permissions.password}
                aria-disabled={!permissions.password}
                {...register("confirmPassword")}
                placeholder={
                  isEdit ? "Leave blank to keep current password" : "Confirm password"
                }
                required={!isEdit}
                className={fieldClass("border-input", permissions.password)}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* BATCHES */}
          <div className="space-y-2">
            <Label className="font-medium text-foreground">Batches</Label>

            {permissions.batches ? (
              <BatchSelector
                branches={branches}
                selectedBranchIds={selectedBranchIds}
                onBranchChange={setSelectedBranchIds}
                selectedBatchIds={selectedBatchIds}
                onBatchChange={(ids) => {
                  setValue("batchIds", ids, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                }}
              />
            ) : (
              <div
                aria-disabled="true"
                className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-input bg-muted/60 px-4 py-3 text-muted-foreground"
              >
                {selectedBatchNames.length > 0 ? (
                  selectedBatchNames.map((name) => (
                    <Badge key={name} variant="secondary" className="rounded-full">
                      {name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm">No batches assigned</span>
                )}
              </div>
            )}

            {/* Always submitted (not readOnly/disabled) so the
                existing value reaches the server action even
                when the visible selector above is read-only. */}
            <input
              type="hidden"
              {...register("batchIds")}
              value={JSON.stringify(selectedBatchIds)}
              readOnly
            />

            {errors.batchIds && (
              <p className="text-sm text-destructive">
                {String(errors.batchIds.message)}
              </p>
            )}
          </div>

          {/* SUBJECTS */}
<div className="space-y-3">
  <div>
    <Label className="font-medium text-foreground">Subjects</Label>
    <p className="mt-1 text-sm text-muted-foreground">
      Choose the subjects this student should study.
    </p>
  </div>

  {permissions.subjects ? (
    <>
      {selectedBatchIds.length === 0 && (
        <div className="flex h-12 items-center rounded-xl border border-dashed border-border bg-muted px-4 text-sm text-muted-foreground">
          Select a batch to choose subjects.
        </div>
      )}

      {selectedBatchIds.length > 0 && availableSubjects.length === 0 && (
        <div className="flex h-12 items-center rounded-xl border border-dashed border-border bg-muted px-4 text-sm text-muted-foreground">
          No subjects are available for the selected batches.
        </div>
      )}

      {availableSubjects.length > 0 && (
        <Combobox
          items={availableSubjects}
          multiple
          value={selectedSubjects}
          onValueChange={(items: Subject[]) =>
            setValue(
              "subjectIds",
              items.map((subject) => subject.id),
              {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
              }
            )
          }
          itemToStringValue={(subject: Subject) => subject.name}
        >
          <ComboboxChips
            ref={subjectAnchor}
            className="min-h-12 overflow-y-auto rounded-xl border-input bg-background px-3 py-2 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20"
          >
            <ComboboxValue>
              {selectedSubjects.map((subject) => (
                <ComboboxChip
                  key={subject.id}
                  className="gap-1.5 rounded-full border-primary/30 bg-primary/10 pl-3 pr-1.5 text-primary"
                >
                  {subject.name}
                </ComboboxChip>
              ))}
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
            <ComboboxEmpty>No subjects found.</ComboboxEmpty>

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
    <div
      aria-disabled="true"
      className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-input bg-muted/60 px-4 py-3 text-muted-foreground"
    >
      {selectedSubjects.length > 0 ? (
        selectedSubjects.map((subject) => (
          <Badge
            key={subject.id}
            variant="secondary"
            className="rounded-full"
          >
            {subject.name}
          </Badge>
        ))
      ) : (
        <span className="text-sm">
          No subjects assigned
        </span>
      )}
    </div>
  )}

  {/* Always submit subjects, including when the field is read-only */}
  <input
    type="hidden"
    {...register("subjectIds")}
    value={JSON.stringify(selectedSubjectIds)}
    readOnly
  />

  {errors.subjectIds && (
    <p className="text-sm text-destructive">
      {String(errors.subjectIds.message)}
    </p>
  )}

  {state?.success && (
    <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
      <p className="text-sm font-medium text-green-600">
        {successText}
      </p>
    </div>
  )}
</div>

          <input type="hidden" name="role" value="STUDENT" />

          {state?.errors && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
              {Object.entries(state.errors).map(([key, value]) => (
                <p key={key} className="text-sm text-destructive">
                  {Array.isArray(value) ? value[0] : value}
                </p>
              ))}
            </div>
          )}

          {state?.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <Button
            type="submit"
            disabled={!isValid || pending}
            className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.99]"
          >
            {pending ? pendingText : submitText}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}