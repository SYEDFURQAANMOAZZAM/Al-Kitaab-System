"use client";

import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";

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


/* =========================================================
   TYPES

   These mirror the Prisma schema shape produced by:

     prisma.branch.findMany({
       include: {
         batches: {
           include: {
             patterns: { include: { pattern: true } },
           },
         },
       },
     })

   See lib/queries/branches.ts (getBranchesWithBatches) for
   the exact query these types are meant to line up with.
========================================================= */

export type FormMode =
  | "create"
  | "edit";

// Mirrors Prisma `Pattern` (only the scalar fields this
// form needs — name is enough to render a toggle chip).
export type Pattern = {
  id: string;
  name: string;
};

// Mirrors Prisma `BatchPattern` with `pattern` included.
export type BatchPattern = {
  id: string;
  batchId: string;
  patternId: string;

  pattern: Pattern;
};

// Mirrors Prisma `Batch` with `patterns` included.
export type Batch = {
  id: string;
  name: string;
  patterns: BatchPattern[];
};

// Mirrors Prisma `Branch` with `batches` included.
export type Branch = {
  id: string;
  name: string;
  batches: Batch[];
};


export type UserFormValues = {
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

  patternIds: string[];
};

export type UserFormState = {
  success?: boolean;
  message?: string;

  errors?: Record<
    string,
    string | string[]
  >;
};

type UserFormAction = (
  prevState: UserFormState,
  formData: FormData
) => Promise<UserFormState>;

/**
 * Shape the parent page must pass in for `mode="edit"`.
 *
 * IMPORTANT — schema mapping notes:
 *
 * - `id` is the User.id (not Student.id / Teacher.id). The
 *   Student/Teacher rows are looked up via their `userId`
 *   relation, so the User id is the one identifier both
 *   roles share.
 *
 * - `email`, `phone`, `phone2` come straight off `User`,
 *   which defines them as nullable (`String?`). Pass the
 *   raw Prisma value through (null is fine) — the form
 *   coerces null/undefined to "" via `?? ""`.
 *
 * - `fatherName` and `address` only exist on `Student`.
 *   NOTE: the Prisma field is spelled `Adress` (capital A,
 *   one "d"). Map it when you load the record:
 *
 *     address: student.Adress
 *
 *   and map it back the same way in the update action:
 *
 *     Adress: formData.get("address")
 *
 *   The form itself intentionally uses the cleaner
 *   `address` name — only the loader/action need to know
 *   about the schema's actual spelling.
 *
 * - `batchIds` is NOT a column anywhere. It's derived from
 *   the join table for the role:
 *     STUDENT -> student.enrollments.map(e => e.batchId)
 *     TEACHER -> teacher.assignments.map(a => a.batchId)
 *
 * - `patternIds` is also derived, and STUDENT-only (there
 *   is no teacher/pattern relation in the schema):
 *     student.studentPatterns.map(sp => sp.patternId)
 */
type UserFormUser = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  phone2?: string | null;
  fatherName?: string | null;
  address?: string | null;

  batchIds?: string[];
  patternIds?: string[];

  role: "STUDENT" | "TEACHER";
};

type UserFormProps = {
  mode: "create" | "edit";
  role: "TEACHER" | "STUDENT";
  action: UserFormAction;
  branches: Branch[];
  user?: UserFormUser;
};


/* =========================================================
   COMPONENT
========================================================= */

export default function UserForm({
  mode,
  role,
  action,
  branches,
  user,
}: UserFormProps) {
  const isEdit = mode === "edit";

  const router = useRouter();


  /* =======================================================
     SERVER ACTION
  ======================================================= */

  const [state, formAction, pending] =
    useActionState(
      action,
      {}
    );


  useEffect(() => {
    if (state?.success) {
      router.replace(
        "/Admin/students/stats"
      );
    }
  }, [
    state?.success,
    router,
  ]);


  /* =======================================================
     SCHEMA
  ======================================================= */

  const schema = isEdit
  ? EditSchemaStudent
  : CreateSchemaStudent;


  /* =======================================================
     BRANCH UI STATE
     
     This is ONLY for BatchSelector's branch UI.
     
     Batch selection itself is controlled by React Hook Form.

     In edit mode, this is derived from the student's/teacher's
     existing batchIds (see the reset effect below) so that
     BatchSelector opens already showing the correct branches
     and batches instead of an empty selector.
  ======================================================= */


  
  const [
    selectedBranchIds,
    setSelectedBranchIds,
  ] = useState<string[]>([]);


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
  } = useForm<UserFormValues>({
    resolver:
      zodResolver(schema) as never,

    mode: "onChange",

    defaultValues: {
      userId:
        user?.id ?? "",

      name:
        user?.name ?? "",

      email:
        user?.email ?? "",

      phone:
        user?.phone ?? "",

      phone2:
        user?.phone2 ?? "",

      fatherName:
        user?.fatherName ?? "",

      address:
        user?.address ?? "",

      password: "",

      confirmPassword: "",

      batchIds:
        user?.batchIds ?? [],

      patternIds:
        user?.patternIds ?? [],
    } as DefaultValues<UserFormValues>,
  });


  /* =======================================================
     RESET EDIT DATA

     Restores every stored field for the user being edited
     (name, email, phone, phone2, father's name, address,
     batchIds, patternIds), and also derives which branches
     own the user's existing batches so BatchSelector shows
     the correct branch + batch selection immediately.

     All of `email` / `phone` / `phone2` / `fatherName` /
     `address` are nullable on the schema, so `?? ""` is
     doing real work here, not just guarding undefined.
  ======================================================= */

  useEffect(() => {
    if (!user) return;

    const userBatchIds =
      user.batchIds ?? [];

    // Derive the branches that own the user's currently
    // assigned batches, so BatchSelector's branch UI state
    // is pre-populated in edit mode.
    const derivedBranchIds = branches
      .filter((branch) =>
        branch.batches.some((batch) =>
          userBatchIds.includes(batch.id)
        )
      )
      .map((branch) => branch.id);

    setSelectedBranchIds(derivedBranchIds);

    reset({
      userId:
        user.id ?? "",

      name:
        user.name ?? "",

      email:
        user.email ?? "",

      phone:
        user.phone ?? "",

      phone2:
        user.phone2 ?? "",

      fatherName:
        user.fatherName ?? "",

      address:
        user.address ?? "",

      password: "",

      confirmPassword: "",

      batchIds: userBatchIds,

      patternIds:
        user.patternIds ?? [],
    });

  }, [
    user,
    branches,
    reset,
  ]);


  /* =======================================================
     WATCH FORM VALUES
     
     React Hook Form is the single source of truth for:
     
       batchIds
       patternIds
  ======================================================= */

  const selectedBatchIds =
    watch("batchIds") ?? [];

  const selectedPatternIds =
    watch("patternIds") ?? [];


  /* =======================================================
     ALL BATCHES
     
     Branches are only used to group batches.
  ======================================================= */

  const allBatches = useMemo(
    () => branches.flatMap((branch) => branch.batches),
    [branches]
  );


  /* =======================================================
     AVAILABLE PATTERNS
     
     Selected batches
            ↓
     batch.patterns
            ↓
     deduplicate by pattern.id
  ======================================================= */

  const availablePatterns = useMemo(() => {
    const patternMap = new Map<string, Pattern>();

    for (const batchId of selectedBatchIds) {
      const batch = allBatches.find(
        (batch) => batch.id === batchId
      );

      if (!batch) continue;

      for (const batchPattern of batch.patterns) {
        patternMap.set(
          batchPattern.pattern.id,
          batchPattern.pattern
        );
      }
    }

    return Array.from(patternMap.values());
  }, [selectedBatchIds, allBatches]);


  /* =======================================================
     PRUNE INVALID PATTERNS
     
     Example:
     
     Batch A -> Pattern X
     Batch B -> Pattern Y
     
     Select A + B:
       X, Y
     
     Remove A:
       X disappears
       Y remains
     
     Therefore X is automatically removed from
     patternIds.
  ======================================================= */

  useEffect(() => {

    const availableIds =
      new Set(
        availablePatterns.map(
          (pattern) =>
            pattern.id
        )
      );

    const validPatternIds =
      selectedPatternIds.filter(
        (patternId) =>
          availableIds.has(
            patternId
          )
      );

    if (
      validPatternIds.length !==
      selectedPatternIds.length
    ) {

      setValue(
        "patternIds",
        validPatternIds,
        {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        }
      );
    }

  }, [
    availablePatterns,
    selectedPatternIds,
    setValue,
  ]);


  /* =======================================================
     ROLE TEXT
  ======================================================= */

  const roleLabel =
    role === "STUDENT"
      ? "Student"
      : "Teacher";

  const pageTitle =
    isEdit
      ? `Edit ${roleLabel}`
      : `Register New ${roleLabel}`;

  const pageDescription =
    isEdit
      ? `Update ${roleLabel.toLowerCase()} details.`
      : `Fill in the ${roleLabel.toLowerCase()}'s details.`;

  const submitText =
    isEdit
      ? `Update ${roleLabel}`
      : `Create ${roleLabel}`;

  const pendingText =
    isEdit
      ? `Updating ${roleLabel}...`
      : `Creating ${roleLabel}...`;


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Card className="col-span-12 overflow-visible border-border shadow-xl">

      <CardContent className="overflow-visible p-6 sm:p-8 lg:p-10">


        {/* =================================================
            HEADER
        ================================================= */}

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

            Role: {roleLabel}

          </span>

        </div>


        {/* =================================================
            FORM
        ================================================= */}

        <form
          action={formAction}
          className="space-y-6"
        >


          {/* =================================================
              USER ID
          ================================================= */}

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
              <span className="text-red-500">
                *
              </span>
            </Label>


            <div className="relative">

              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="name"
                {...register("name")}
                placeholder="Enter full name"
                className="h-12 rounded-xl border-input bg-background pl-10 transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
              />

            </div>


            {errors.name && (
              <p className="text-sm text-red-600">
                {errors.name.message}
              </p>
            )}

          </div>


          {/* =================================================
              STUDENT DETAILS

              fatherName / address only exist on the Student
              model. Note the Prisma column backing `address`
              is spelled `Adress` — that mapping happens where
              the record is loaded/saved, not here.
          ================================================= */}

          {role === "STUDENT" && (
            <>

              {/* FATHER NAME */}

              <div className="space-y-2">

                <Label
                  htmlFor="fatherName"
                  className="font-medium text-foreground"
                >
                  Father&apos;s Name{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </Label>


                <Input
                  id="fatherName"
                  {...register("fatherName")}
                  placeholder="Enter father's name"
                  className="h-12 rounded-xl border-input bg-background transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                />


                {errors.fatherName && (
                  <p className="text-sm text-red-600">
                    {errors.fatherName.message}
                  </p>
                )}

              </div>


              {/* ADDRESS */}

              <div className="space-y-2">

                <Label
                  htmlFor="address"
                  className="font-medium text-foreground"
                >
                  Address{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </Label>


                <textarea
                  id="address"
                  {...register("address")}
                  placeholder="Enter address"
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                />


                {errors.address && (
                  <p className="text-sm text-red-600">
                    {errors.address.message}
                  </p>
                )}

              </div>

            </>
          )}


          {/* =================================================
              EMAIL
              
              Full width on its own row. Nullable on the
              schema (User.email String?), so it's the one
              contact field that's never marked required here.
          ================================================= */}

          <div className="space-y-2">

            <Label
              htmlFor="email"
              className="font-medium text-foreground"
            >
              Email Address
            </Label>


            <div className="relative">

              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="user@alkitaab.com"
                className="h-12 rounded-xl border-input bg-background pl-10 transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
              />

            </div>


            {errors.email && (
              <p className="text-sm text-red-600">
                {errors.email.message}
              </p>
            )}

          </div>


          {/* =================================================
              PHONE + PHONE 2
              
              Both live on User (phone, phone2 — both String?).
              Paired together on the same line for md-xl
              screens. Students get both fields; teachers
              only surface `phone` here, so it takes the
              full row. (phone2 still exists on Teacher's
              underlying User row if you ever want to expose
              it — this form just doesn't render it for
              teachers.)
          ================================================= */}

          <div
            className={
              role === "STUDENT"
                ? "grid gap-6 md:grid-cols-2"
                : "grid gap-6"
            }
          >


            {/* PHONE */}

            <div className="space-y-2">

              <Label
                htmlFor="phone"
                className="font-medium text-foreground"
              >
                Phone Number{" "}
                <span className="text-red-500">
                  *
                </span>
              </Label>


              <div className="relative">

                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  placeholder="e.g. 9876543210"
                  className="h-12 rounded-xl border-input bg-background pl-10 transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                />

              </div>


              {errors.phone && (
                <p className="text-sm text-red-600">
                  {errors.phone.message}
                </p>
              )}

            </div>


            {/* PHONE 2 (students only) */}

            {role === "STUDENT" && (

              <div className="space-y-2">

                <Label
                  htmlFor="phone2"
                  className="font-medium text-foreground"
                >
                  Phone Number 2
                </Label>


                <div className="relative">

                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="phone2"
                    type="tel"
                    {...register("phone2")}
                    placeholder="Optional alternate phone number"
                    className="h-12 rounded-xl border-input bg-background pl-10 transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />

                </div>


                {errors.phone2 && (
                  <p className="text-sm text-red-600">
                    {errors.phone2.message}
                  </p>
                )}

              </div>

            )}

          </div>


          {/* =================================================
              PASSWORD
          ================================================= */}

          <div className="grid gap-6 sm:grid-cols-2">


            {/* PASSWORD */}

            <div className="space-y-2">

              <Label
                htmlFor="password"
                className="font-medium text-foreground"
              >
                Password{" "}
                {!isEdit && (
                  <span className="text-red-500">
                    *
                  </span>
                )}
              </Label>


              <PasswordInput
                id="password"
                {...register("password", {
                  onChange: () =>
                    trigger(
                      "confirmPassword"
                    ),
                })}
                placeholder={
                  isEdit
                    ? "Leave blank to keep current password"
                    : "Enter password"
                }
                required={!isEdit}
                className="border-input"
              />


              {errors.password && (
                <p className="text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}

            </div>


            {/* CONFIRM PASSWORD */}

            <div className="space-y-2">

              <Label
                htmlFor="confirmPassword"
                className="font-medium text-foreground"
              >
                Confirm Password{" "}
                {!isEdit && (
                  <span className="text-red-500">
                    *
                  </span>
                )}
              </Label>


              <PasswordInput
                id="confirmPassword"
                {...register(
                  "confirmPassword"
                )}
                placeholder={
                  isEdit
                    ? "Leave blank to keep current password"
                    : "Confirm password"
                }
                required={!isEdit}
                className="border-input"
              />


              {errors.confirmPassword && (
                <p className="text-sm text-red-600">
                  {
                    errors
                      .confirmPassword
                      .message
                  }
                </p>
              )}

            </div>

          </div>


          {/* =================================================
              BATCHES

              batchIds is derived, not stored directly:
                STUDENT -> Student.enrollments (StudentEnrollment.batchId)
                TEACHER -> Teacher.assignments (TeacherAssignment.batchId)

              IMPORTANT:

              BatchSelector controls selection.

              It MUST call:

                onBatchChange(nextIds)

              We then put those IDs into React Hook Form.
              The server action is responsible for diffing
              these against the existing join-table rows
              (create/delete StudentEnrollment or
              TeacherAssignment rows as needed) — Prisma has
              no "set batchIds" shortcut since it's a
              many-to-many via an explicit join model.

              In edit mode, selectedBranchIds is pre-derived
              from the user's batchIds (see reset effect
              above), so this opens already scoped to the
              user's current branches/batches.
          ================================================= */}

          <div className="space-y-2">

            <BatchSelector
              branches={branches}

              selectedBranchIds={
                selectedBranchIds
              }

              onBranchChange={
                setSelectedBranchIds
              }

              selectedBatchIds={
                selectedBatchIds
              }

              onBatchChange={(ids) => {

                setValue(
                  "batchIds",
                  ids,
                  {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  }
                );

              }}
            />


            {/* Hidden value sent through FormData */}

            <input
              type="hidden"
              {...register("batchIds")}
              value={JSON.stringify(
                selectedBatchIds
              )}
              readOnly
            />


            {errors.batchIds && (
              <p className="text-sm text-red-600">
                {String(
                  errors.batchIds
                    .message
                )}
              </p>
            )}

          </div>


          {/* =================================================
              PATTERNS

              Only students — there is no Teacher/Pattern
              relation in the schema.

              patternIds is derived from Student.studentPatterns
              (StudentPattern.patternId), and the options shown
              are derived from the selected batches' BatchPattern
              rows.
          ================================================= */}

        {role === "STUDENT" && (
  <div className="space-y-3">

    <div>
      <Label className="font-medium text-foreground">
        Patterns
      </Label>

      <p className="mt-1 text-sm text-muted-foreground">
        Choose the study patterns this student should use.
      </p>
    </div>

    {/* NO BATCH SELECTED */}
    {selectedBatchIds.length === 0 && (
      <div className="flex h-12 items-center rounded-xl border border-dashed border-border bg-muted px-4 text-sm text-muted-foreground">
        Select a batch to choose patterns.
      </div>
    )}

    {/* BATCH SELECTED BUT NO PATTERNS */}
    {selectedBatchIds.length > 0 &&
      availablePatterns.length === 0 && (
        <div className="flex h-12 items-center rounded-xl border border-dashed border-border bg-muted px-4 text-sm text-muted-foreground">
          No patterns are available for the selected batches.
        </div>
      )}

    {/* PATTERN NAMES */}
    {availablePatterns.length > 0 && (
      <div className="flex flex-wrap gap-2">

        {availablePatterns.map((pattern) => {
          const selected =
            selectedPatternIds.includes(pattern.id);

          return (
            <button
              key={pattern.id}
              type="button"
              onClick={() => {
                const nextIds = selected
                  ? selectedPatternIds.filter(
                      (id) => id !== pattern.id
                    )
                  : [
                      ...selectedPatternIds,
                      pattern.id,
                    ];

                setValue(
                  "patternIds",
                  nextIds,
                  {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  }
                );
              }}
              className={[
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                selected
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950 dark:text-emerald-300"
                  : "border-border bg-background text-foreground hover:bg-muted",
              ].join(" ")}
            >
              {pattern.name}
            </button>
          );
        })}

      </div>
    )}

    {/* HIDDEN FORM VALUE */}
    <input
      type="hidden"
      {...register("patternIds")}
      value={JSON.stringify(selectedPatternIds)}
      readOnly
    />

    {errors.patternIds && (
      <p className="text-sm text-red-600">
        {String(errors.patternIds.message)}
      </p>
    )}

  </div>
)}


          {/* =================================================
              ROLE
          ================================================= */}

          <input
            type="hidden"
            name="role"
            value={role}
          />


          {/* =================================================
              SERVER ERRORS
          ================================================= */}

          {state?.errors && (

            <div className="rounded-xl border border-red-200 bg-red-50 p-4">

              {Object.entries(
                state.errors
              ).map(
                ([key, value]) => (

                  <p
                    key={key}
                    className="text-sm text-red-700"
                  >
                    {
                      Array.isArray(
                        value
                      )
                        ? value[0]
                        : value
                    }
                  </p>

                )
              )}

            </div>

          )}


          {/* SERVER MESSAGE */}

          {state?.message && (

            <p className="text-sm text-red-600">
              {state.message}
            </p>

          )}


          {/* =================================================
              SUBMIT
          ================================================= */}

          <Button
            type="submit"
            disabled={
              !isValid ||
              pending
            }
            className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.99]"
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