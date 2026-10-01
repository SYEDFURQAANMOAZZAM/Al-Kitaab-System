"use client";

import {
  useActionState,
  useEffect,
} from "react";

import {
  useForm,
  type DefaultValues,
} from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  ShieldCheck,
  User,
  Mail,
  Phone,
} from "lucide-react";

import Image from "next/image";

import {
  CreateSchemaAdmin,
  EditSchemaAdmin,
} from "@/app/ServerActions/auth/Validate";

import { PasswordInput } from "@/components/passwordInput";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import type { FormStateAdmin } from "@/app/ServerActions/admin/types/admin.types";

/* =========================================================
   TYPES
========================================================= */

export type FormMode =
  | "create"
  | "edit";

export type AdminFormValues = {
  userId?: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type AdminFormUser = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

type AdminFormAction = (
  prevState: FormStateAdmin,
  formData: FormData,
) => Promise<FormStateAdmin>;

type AdminFormProps = {
  mode: FormMode;
  action: AdminFormAction;
  user?: AdminFormUser;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AdminForm({
  mode,
  action,
  user,
}: AdminFormProps) {
  const isEdit = mode === "edit";

  /* =======================================================
     SERVER ACTION
  ======================================================= */

  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    action,
    {},
  );

  /* =======================================================
     SCHEMA
  ======================================================= */

  const schema = isEdit
    ? EditSchemaAdmin
    : CreateSchemaAdmin;

  /* =======================================================
     FORM
  ======================================================= */

  const {
    register,
    reset,
    trigger,
    formState: {
      errors,
      isValid,
    },
  } = useForm<AdminFormValues>({
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

      password: "",

      confirmPassword: "",
    } as DefaultValues<AdminFormValues>,
  });

  /* =======================================================
     RESET WHEN EDIT DATA CHANGES
  ======================================================= */

  useEffect(() => {
    if (!user) return;

    reset({
      userId: user.id,

      name:
        user.name ?? "",

      email:
        user.email ?? "",

      phone:
        user.phone ?? "",

      password: "",

      confirmPassword: "",
    });

    void trigger();
  }, [user, reset, trigger]);

  /* =======================================================
     TEXT
  ======================================================= */

  const pageTitle = isEdit
    ? "Edit Admin"
    : "Register New Admin";

  const pageDescription = isEdit
    ? "Update the administrator's details."
    : "Create a new administrator account.";

  const submitText = isEdit
    ? "Update Admin"
    : "Create Admin";

  const pendingText = isEdit
    ? "Updating Admin..."
    : "Creating Admin...";

  const successText = isEdit
    ? "Admin updated successfully."
    : "Admin registered successfully.";

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

          {/* Light theme logo */}
          <Image
            src="/lightThemeLogo.jpeg"
            alt="AlKitaab Academy"
            width={900}
            height={900}
            priority
            className="mb-5 block h-24 w-24 object-contain dark:hidden sm:h-28 sm:w-28"
          />

          {/* Dark theme logo */}
          <Image
            src="/darkThemeLogo.png"
            alt="AlKitaab Academy"
            width={900}
            height={900}
            priority
            className="mb-5 hidden h-24 w-24 object-contain dark:block sm:h-28 sm:w-28"
          />

          <h1 className="text-2xl font-bold text-card-foreground sm:text-3xl">
            {pageTitle}
          </h1>

          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {pageDescription}
          </p>

          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground ring-1 ring-border">
            <ShieldCheck className="h-3.5 w-3.5" />
            Role: Admin
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
                  {...register("email")}
                  placeholder="admin@example.com"
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

          {/* =================================================
              PASSWORD + CONFIRM PASSWORD
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
                  <span className="text-destructive">
                    *
                  </span>
                )}
              </Label>

              <PasswordInput
                id="password"
                {...register("password", {
                  onChange: () =>
                    trigger(
                      "confirmPassword",
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
                <p className="text-sm text-destructive">
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
                  <span className="text-destructive">
                    *
                  </span>
                )}
              </Label>

              <PasswordInput
                id="confirmPassword"
                {...register(
                  "confirmPassword",
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

              {Object.entries(
                state.errors,
              ).map(
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

          {/* =================================================
              SERVER MESSAGE
          ================================================= */}

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
              text-primary-foreground
              shadow-sm
              transition-all
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