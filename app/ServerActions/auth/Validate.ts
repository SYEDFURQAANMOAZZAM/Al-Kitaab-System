import { Role } from "@/generated/prisma/enums";
import * as z from "zod";

/* =========================================================
   COMMON USER FIELDS
========================================================= */

const UserBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .regex(/^[A-Za-z ]+$/, {
      error:
        "Name must not contain numbers or special characters.",
    })
    .min(3, {
      error: "Name must be at least 3 characters long.",
    }),

  email: z
    .email({
      error: "Please enter a valid email.",
    })
    .trim(),

  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, {
      error: "Enter a valid 10-digit phone number.",
    }),

  password: z
    .string()
    .min(8, {
      error: "Password must be at least 8 characters.",
    })
    .regex(/[A-Z]/, {
      error: "Contain at least one uppercase letter.",
    })
    .regex(/[a-z]/, {
      error: "Contain at least one lowercase letter.",
    })
    .regex(/[0-9]/, {
      error: "Contain at least one number.",
    })
    .regex(/[^a-zA-Z0-9]/, {
      error: "Contain at least one special character.",
    }),

  confirmPassword: z
    .string()
    .min(1, {
      error: "Confirm your password.",
    }),
});

/* =========================================================
   BRANCH + BATCH
========================================================= */

const BranchBatchSchema = z.object({
  branchId: z
    .string()
    .min(1, {
      error: "Branch is required.",
    }),

  batch: z
    .array(z.string())
    .min(1, {
      error: "Select at least one batch.",
    }),
});

/* =========================================================
   PASSWORD MATCH
========================================================= */

const passwordMatch = (
  data: {
    password: string;
    confirmPassword: string;
  }
) => data.password === data.confirmPassword;

/* =========================================================
   STUDENT
========================================================= */

export const SignupFormSchemaStudent =
  UserBaseSchema
    .extend({
      role: z.literal(Role.STUDENT),

      ...BranchBatchSchema.shape,
    })
    .refine(passwordMatch, {
      path: ["confirmPassword"],
      message: "Passwords do not match.",
    });

/* =========================================================
   TEACHER
========================================================= */

export const SignupFormSchemaTeacher =
  UserBaseSchema
    .extend({
      role: z.literal(Role.TEACHER),

      ...BranchBatchSchema.shape,
    })
    .refine(passwordMatch, {
      path: ["confirmPassword"],
      message: "Passwords do not match.",
    });

/* =========================================================
   LOGIN
========================================================= */

export const LoginFormSchema = z.object({
  email: z
    .email({
      error: "Please enter a valid email.",
    })
    .trim(),

  password: z
    .string()
    .min(1, {
      error: "Password is required.",
    }),
});

/* =========================================================
   REGISTER STATE
========================================================= */

export type FormStateRegister =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        phone?: string[];
        password?: string[];
        confirmPassword?: string[];
        role?: string[];
        branchId?: string[];
        batch?: string[];
      };

      message?: string;
    }
  | undefined;

/* =========================================================
   LOGIN STATE
========================================================= */

export type FormStateLogin =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };

      message?: string;
    }
  | undefined;