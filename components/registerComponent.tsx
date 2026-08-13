"use client";

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
  ChevronDown,
  Check,
  Search,
} from "lucide-react";
import {SignupFormSchemaStudent} from "@/app/ServerActions/auth/Validate";
import type { z } from "zod";

import { PasswordInput } from "@/components/passwordInput";
import MultiSelect from "@/components/MultiSelect";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

/* =========================================================
   TYPES
========================================================= */

export type UserRole =
  | "STUDENT"
  | "TEACHER"
  | "ADMIN";

export type FormMode =
  | "create"
  | "edit";

export type Branch = {
  id: string;
  name: string;

  batches: {
    id: string;
    name: string;
  }[];
};

export type UserFormValues = {
  userId?: string;

  name: string;
  email: string;
  phone: string;

  password: string;
  confirmPassword: string;

  role: UserRole;

  branchId: string;
  batch: string[];
};

export type UserFormState = {
  message?: string;

  errors?: Record<
    string,
    string | string[]
  >;
};

type UserFormAction = (
  prevState: UserFormState | undefined,
  formData: FormData
) => Promise<UserFormState | undefined>;

type UserFormUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  branchId: string;
  batch: string[];
  role: "STUDENT";
};

type UserFormProps = {
  mode: "create" | "edit";
  role: UserRole;
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
  user
}: UserFormProps) {
  const isEdit = mode === "edit";

  /* =======================================================
     SERVER ACTION
  ======================================================= */

  const [state, formAction, pending] =
    useActionState(action, undefined);

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
    resolver: zodResolver(SignupFormSchemaStudent),

    mode: "onChange",

    defaultValues: {
      userId: user?.id ?? "",

      name: user?.name ?? "",

      email: user?.email ?? "",

      phone: user?.phone ?? "",

      password: "",

      confirmPassword: "",

      role,

      branchId:
        user?.branchId ?? "",

      batch:
        user?.batch ?? [],
    } as DefaultValues<UserFormValues>,
  });

  /* =======================================================
     RESET EDIT DATA
  ======================================================= */

  useEffect(() => {
    if (!user) return;

    reset({
      userId: user.id ?? "",

      name: user.name ?? "",

      email: user.email ?? "",

      phone: user.phone ?? "",

      password: "",

      confirmPassword: "",

      role,

      branchId:
        user.branchId ?? "",

      batch:
        user.batch ?? [],
    });
  }, [user, reset, role]);

  /* =======================================================
     WATCH
  ======================================================= */

  const selectedBranchId =
    watch("branchId");

  const selectedBatch =
    watch("batch");

  /* =======================================================
     SELECTED BRANCH
  ======================================================= */

  const selectedBranch = useMemo(() => {
    return branches.find(
      (branch) =>
        branch.id === selectedBranchId
    );
  }, [branches, selectedBranchId]);

  /* =======================================================
     BATCH OPTIONS
  ======================================================= */

  const batchOptions = useMemo(() => {
    return (
      selectedBranch?.batches ?? []
    ).map((batch) => ({
      label: batch.name,
      value: batch.id,
    }));
  }, [selectedBranch]);

  /* =======================================================
     RESET INVALID BATCHES
  ======================================================= */

  useEffect(() => {
    if (!selectedBranchId) {
      if (selectedBatch.length > 0) {
        setValue("batch", [], {
          shouldValidate: true,
        });
      }

      return;
    }

    const validBatchIds =
      selectedBranch?.batches.map(
        (batch) => batch.id
      ) ?? [];

    const validBatches =
      selectedBatch.filter((id) =>
        validBatchIds.includes(id)
      );

    if (
      validBatches.length !==
      selectedBatch.length
    ) {
      setValue(
        "batch",
        validBatches,
        {
          shouldValidate: true,
        }
      );
    }
  }, [
    selectedBranchId,
    selectedBranch,
    selectedBatch,
    setValue,
  ]);

  /* =======================================================
     ROLE LABEL
  ======================================================= */

  const roleLabel =
    role === "STUDENT"
      ? "Student"
      : role === "TEACHER"
        ? "Teacher"
        : "Admin";

  /* =======================================================
     TEXT
  ======================================================= */

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
    <Card className="col-span-12 overflow-visible border-slate-200 shadow-xl">
      <CardContent className="overflow-visible p-6 sm:p-8 lg:p-10">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col items-center text-center sm:mb-10">

          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-700 shadow-lg sm:h-20 sm:w-20">
            <BookOpen className="h-8 w-8 text-white sm:h-10 sm:w-10" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {pageTitle}
          </h1>

          <p className="mt-2 max-w-xl text-sm text-slate-500">
            {pageDescription}
          </p>

          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
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
              className="font-medium text-slate-700"
            >
              Full Name{" "}
              <span className="text-red-500">
                *
              </span>
            </Label>

            <div className="relative">

              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <Input
                id="name"
                {...register("name")}
                placeholder="Enter full name"
                className="h-12 rounded-xl border-slate-300 bg-white pl-10 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />

            </div>

            {errors.name && (
              <p className="text-sm text-red-600">
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
                className="font-medium text-slate-700"
              >
                Email Address{" "}
                <span className="text-red-500">
                  *
                </span>
              </Label>

              <div className="relative">

                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="user@alkitaab.com"
                  className="h-12 rounded-xl border-slate-300 bg-white pl-10 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

              </div>

              {errors.email && (
                <p className="text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}

            </div>

            {/* PHONE */}

            <div className="space-y-2">

              <Label
                htmlFor="phone"
                className="font-medium text-slate-700"
              >
                Phone Number{" "}
                <span className="text-red-500">
                  *
                </span>
              </Label>

              <div className="relative">

                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  placeholder="e.g. 9876543210"
                  className="h-12 rounded-xl border-slate-300 bg-white pl-10 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

              </div>

              {errors.phone && (
                <p className="text-sm text-red-600">
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
                className="font-medium text-slate-700"
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
                className="border-slate-300"
              />

              {errors.password && (
                <p className="text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}

            </div>

            <div className="space-y-2">

              <Label
                htmlFor="confirmPassword"
                className="font-medium text-slate-700"
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
                className="border-slate-300"
              />

              {errors.confirmPassword && (
                <p className="text-sm text-red-600">
                  {
                    errors.confirmPassword
                      .message
                  }
                </p>
              )}

            </div>

          </div>

          {/* =================================================
              BRANCH
          ================================================= */}

          <div className="space-y-2">

            <Label
              htmlFor="branchId"
              className="font-medium text-slate-700"
            >
              Branch{" "}
              <span className="text-red-500">
                *
              </span>
            </Label>

            <Select
              value={selectedBranchId || ""}
              onValueChange={(value) => {
                setValue(
                  "branchId",
                  value,
                  {
                    shouldValidate: true,
                    shouldDirty: true,
                  }
                );
              }}
            >

              <SelectTrigger
                id="branchId"
                className="
                  h-12
                  w-full
                  rounded-xl
                  border-slate-300
                  bg-white
                  px-4
                  text-sm
                  shadow-none
                  transition-all
                  hover:border-slate-400
                  focus:border-emerald-500
                  focus:ring-2
                  focus:ring-emerald-100
                  data-[placeholder]:text-slate-400
                "
              >

                {/* IMPORTANT:
                    Explicitly display the NAME,
                    never the ID.
                */}

                <span
                  className={
                    selectedBranch
                      ? "text-slate-900"
                      : "text-slate-400"
                  }
                >
                  {selectedBranch?.name ??
                    "Select Branch"}
                </span>

              </SelectTrigger>

              <SelectContent
                align="start"
                className="
                  max-h-64
                  overflow-y-auto
                  rounded-xl
                  border-slate-200
                  p-1.5
                  shadow-lg
                "
              >

                {branches.map((branch) => {

                  const isSelected =
                    branch.id ===
                    selectedBranchId;

                  return (
                    <SelectItem
                      key={branch.id}
                      value={branch.id}
                      className="
                        cursor-pointer
                        rounded-lg
                        py-2.5
                        pl-3
                        pr-9
                        text-sm
                        focus:bg-emerald-50
                        focus:text-emerald-800
                      "
                    >

                      <div className="flex w-full items-center justify-between">

                        <span>
                          {branch.name}
                        </span>

                        {isSelected && (
                          <Check className="h-4 w-4 text-emerald-600" />
                        )}

                      </div>

                    </SelectItem>
                  );

                })}

              </SelectContent>

            </Select>

            {/* Submit ID to server */}
            <input
              type="hidden"
              name="branchId"
              value={selectedBranchId || ""}
            />

            {errors.branchId && (
              <p className="text-sm text-red-600">
                {errors.branchId.message}
              </p>
            )}

          </div>

          {/* =================================================
              BATCH
          ================================================= */}

          <div className="space-y-2">

            <Label
              className="font-medium text-slate-700"
            >
              Batch{" "}
              <span className="text-red-500">
                *
              </span>
            </Label>

            {!selectedBranchId ? (

              <div className="
                flex
                h-12
                items-center
                rounded-xl
                border
                border-dashed
                border-slate-300
                bg-slate-50
                px-4
                text-sm
                text-slate-500
              ">
                Select a branch to choose batches.
              </div>

            ) : batchOptions.length === 0 ? (

              <div className="
                flex
                h-12
                items-center
                rounded-xl
                border
                border-dashed
                border-slate-300
                bg-slate-50
                px-4
                text-sm
                text-slate-500
              ">
                No batches available for this branch.
              </div>

            ) : (

              <div className="
                rounded-xl
                transition-all
                focus-within:ring-2
                focus-within:ring-emerald-100
              ">

                <MultiSelect
                  options={batchOptions}
                  value={selectedBatch}
                  onChange={(values) => {
                    setValue(
                      "batch",
                      values,
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      }
                    );
                  }}
                />

              </div>

            )}

            {/* Submit selected batch IDs */}
            <input
              type="hidden"
              name="batch"
              value={JSON.stringify(
                selectedBatch
              )}
            />

            {errors.batch && (
              <p className="text-sm text-red-600">
                {String(
                  errors.batch.message
                )}
              </p>
            )}

          </div>

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
              ).map(([key, value]) => (
                <p
                  key={key}
                  className="text-sm text-red-700"
                >
                  {Array.isArray(value)
                    ? value[0]
                    : value}
                </p>
              ))}

            </div>
          )}

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
              !isValid || pending
            }
            className="
              h-12
              w-full
              rounded-xl
              bg-emerald-700
              text-base
              font-semibold
              shadow-sm
              transition-all
              hover:bg-emerald-800
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