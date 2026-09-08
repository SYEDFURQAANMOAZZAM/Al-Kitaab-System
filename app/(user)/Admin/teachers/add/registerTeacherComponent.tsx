"use client";

import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useMemo,
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
  CreateSchemaTeacher,
  EditSchemaTeacher,
  type FormStateTeacher,
} from "@/app/ServerActions/auth/Validate";

import { PasswordInput } from "@/components/passwordInput";
import MultiSelect from "@/components/MultiSelect";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/* =========================================================
   TYPES
========================================================= */

export type FormMode =
  | "create"
  | "edit";

export type Branch = {
  id: string;
  name: string;

  batches: {
    id: string;
    name: string;
    branchId: string;
  }[];
};

export type UserFormValues = {
  userId?: string;

  name: string;
  email: string;
  phone: string;

  password: string;
  confirmPassword: string;

  branchIds: string[];
  batchIds: string[];
};

export type UserFormUser = {
  id: string;

  name: string;
  email: string | null;
  phone: string | null;

  branchIds: string[];
  batchIds: string[];

  role: "TEACHER";
};

type UserFormAction = (
  prevState: FormStateTeacher,
  formData: FormData
) => Promise<FormStateTeacher>;

type UserFormProps = {
  mode: "create" | "edit";
  role: "TEACHER";
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
  const router = useRouter();

  const isEdit = mode === "edit";

  /* =======================================================
     SERVER ACTION
  ======================================================= */

  const [state, formAction, pending] =
    useActionState<FormStateTeacher, FormData>(
      action,
      {}
    );

  useEffect(() => {
    if (state?.success) {
      router.replace(
        "/Admin/teachers/status"
      );
    }
  }, [state?.success, router]);

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
} = useForm<UserFormValues>({
  resolver: zodResolver(schema),
  mode: "onChange",

  defaultValues: {
    userId: user?.id ?? "",
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    password: "",
    confirmPassword: "",
    branchIds: user?.branchIds ?? [],
    batchIds: user?.batchIds ?? [],
  },
});
  /* =======================================================
     RESET EDIT DATA
  ======================================================= */

  useEffect(() => {
    if (!user) return;

    reset({
      userId: user.id,

      name: user.name ?? "",

      email: user.email ?? "",

      phone: user.phone ?? "",

      password: "",

      confirmPassword: "",

      branchIds:
        user.branchIds ?? [],

      batchIds:
        user.batchIds ?? [],
    });
  }, [user, reset]);

  /* =======================================================
     WATCH
  ======================================================= */

  const selectedBranchIds =
    watch("branchIds") ?? [];

  const selectedBatchIds =
    watch("batchIds") ?? [];

  /* =======================================================
     SELECTED BRANCHES
  ======================================================= */

  const selectedBranches = useMemo(() => {
    return branches.filter((branch) =>
      selectedBranchIds.includes(
        branch.id
      )
    );
  }, [
    branches,
    selectedBranchIds,
  ]);

  /* =======================================================
     BRANCH OPTIONS
  ======================================================= */

  const branchOptions = useMemo(() => {
    return branches.map((branch) => ({
      label: branch.name,
      value: branch.id,
    }));
  }, [branches]);

  /* =======================================================
     BATCH OPTIONS
  ======================================================= */

  const batchOptions = useMemo(() => {
    const batches =
      selectedBranches.flatMap(
        (branch) => branch.batches
      );

    const uniqueBatches = Array.from(
      new Map(
        batches.map((batch) => [
          batch.id,
          batch,
        ])
      ).values()
    );

    return uniqueBatches.map((batch) => ({
      label: batch.name,
      value: batch.id,
    }));
  }, [selectedBranches]);

  /* =======================================================
     REMOVE INVALID BATCHES
  ======================================================= */

  useEffect(() => {
    const validBatchIds = new Set(
      selectedBranches.flatMap(
        (branch) =>
          branch.batches.map(
            (batch) => batch.id
          )
      )
    );

    const validSelectedBatchIds =
      selectedBatchIds.filter((batchId) =>
        validBatchIds.has(batchId)
      );

    if (
      validSelectedBatchIds.length !==
      selectedBatchIds.length
    ) {
      setValue(
        "batchIds",
        validSelectedBatchIds,
        {
          shouldValidate: true,
          shouldDirty: true,
        }
      );
    }
  }, [
    selectedBranches,
    selectedBatchIds,
    setValue,
  ]);

  /* =======================================================
     TEXT
  ======================================================= */

  const roleLabel = "Teacher";

  const pageTitle = isEdit
    ? `Edit ${roleLabel}`
    : `Register New ${roleLabel}`;

  const pageDescription = isEdit
    ? `Update ${roleLabel.toLowerCase()} details.`
    : `Fill in the ${roleLabel.toLowerCase()}'s details.`;

  const submitText = isEdit
    ? `Update ${roleLabel}`
    : `Create ${roleLabel}`;

  const pendingText = isEdit
    ? `Updating ${roleLabel}...`
    : `Creating ${roleLabel}...`;

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
            Role: {roleLabel}
          </span>
        </div>

        {/* FORM */}

        <form
          action={formAction}
          className="space-y-6"
        >

          {/* USER ID */}

          {isEdit && (
            <input
              type="hidden"
              {...register("userId")}
            />
          )}

          {/* NAME */}

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
                {...register("name")}
                placeholder="Enter full name"
                className="h-12 rounded-xl border-input bg-background pl-10 transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
              />

            </div>

            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}

          </div>

          {/* EMAIL + PHONE */}

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
                  {...register("email")}
                  placeholder="teacher@alkitaab.com"
                  className="h-12 rounded-xl border-input bg-background pl-10 transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
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
                  {...register("phone")}
                  placeholder="e.g. 9876543210"
                  className="h-12 rounded-xl border-input bg-background pl-10 transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                />

              </div>

              {errors.phone && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}

            </div>

          </div>

          {/* PASSWORD */}

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
                {...register("password", {
                  onChange: () => {
                    trigger(
                      "confirmPassword"
                    );
                  },
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
                  <p className="text-sm text-destructive">
                  {
                    errors.confirmPassword
                      .message
                  }
                </p>
              )}

            </div>

          </div>

          {/* BRANCHES */}

          <div className="space-y-2">

            <Label className="font-medium text-foreground">
              Branches{" "}
              <span className="text-destructive">
                *
              </span>
            </Label>

            <MultiSelect
              options={branchOptions}
              value={selectedBranchIds}
              onChange={(values) => {
                setValue(
                  "branchIds",
                  values,
                  {
                    shouldValidate: true,
                    shouldDirty: true,
                  }
                );
              }}
            />

            <input
              type="hidden"
              name="branchIds"
              value={JSON.stringify(
                selectedBranchIds
              )}
            />

            {errors.branchIds && (
              <p className="text-sm text-destructive">
                {errors.branchIds.message}
              </p>
            )}

          </div>

          {/* BATCHES */}

          <div className="space-y-2">

            <Label className="font-medium text-foreground">
              Batches{" "}
              <span className="text-destructive">
                *
              </span>
            </Label>

            {selectedBranchIds.length === 0 ? (

              <div className="flex h-12 items-center rounded-xl border border-dashed border-border bg-muted px-4 text-sm text-muted-foreground">
                Select at least one branch to choose batches.
              </div>

            ) : batchOptions.length === 0 ? (

              <div className="flex h-12 items-center rounded-xl border border-dashed border-border bg-muted px-4 text-sm text-muted-foreground">
                No batches available for the selected branches.
              </div>

            ) : (

              <MultiSelect
                options={batchOptions}
                value={selectedBatchIds}
                onChange={(values) => {
                  setValue(
                    "batchIds",
                    values,
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                    }
                  );
                }}
              />

            )}

            <input
              type="hidden"
              name="batchIds"
              value={JSON.stringify(
                selectedBatchIds
              )}
            />

            {errors.batchIds && (
              <p className="text-sm text-destructive">
                {errors.batchIds.message}
              </p>
            )}

          </div>

          {/* SERVER ERRORS */}

          {state?.errors && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">

              {Object.entries(
                state.errors
              ).map(([key, value]) => (
                <p
                  key={key}
                  className="text-sm text-destructive"
                >
                  {Array.isArray(value)
                    ? value[0]
                    : value}
                </p>
              ))}

            </div>
          )}

          {state?.message && (
            <p className="text-sm text-destructive">
              {state.message}
            </p>
          )}

          {/* SUBMIT */}

          <Button
            type="submit"
            disabled={
              !isValid || pending
            }
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