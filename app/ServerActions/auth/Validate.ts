import * as z from "zod";

/* =========================================================
   STUDENT SCHEMAS
========================================================= */

/* ---------------------------------------------------------
   CREATE STUDENT
--------------------------------------------------------- */

export const CreateSchemaStudent = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, {
        error:
          "Name must be at least 3 characters long.",
      })
      .regex(/^[A-Za-z ]+$/, {
        error:
          "Name must not contain numbers or special characters.",
      }),

    email: z
      .string()
      .trim()
      .min(1, {
        error: "Email is required.",
      })
      .email({
        error:
          "Please enter a valid email.",
      }),

    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, {
        error:
          "Enter a valid 10-digit phone number.",
      }),

    phone2: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, {
        error:
          "Enter a valid 10-digit phone number.",
      })
      .or(z.literal("")),

    fatherName: z
      .string()
      .trim()
      .min(2, {
        error:
          "Father's name must be at least 2 characters long.",
      })
      .regex(/^[A-Za-z ]+$/, {
        error:
          "Father's name must not contain numbers or special characters.",
      }),

    address: z
      .string()
      .trim()
      .min(5, {
        error:
          "Address must be at least 5 characters long.",
      }),

    batchIds: z
      .array(z.string().min(1))
      .min(1, {
        error:
          "Select at least one batch.",
      }),

    patternIds: z
      .array(z.string().min(1))
      .default([]),

    password: z
      .string()
      .min(8, {
        error:
          "Password must be at least 8 characters.",
      })
      .regex(/[A-Z]/, {
        error:
          "Contain at least one uppercase letter.",
      })
      .regex(/[a-z]/, {
        error:
          "Contain at least one lowercase letter.",
      })
      .regex(/[0-9]/, {
        error:
          "Contain at least one number.",
      })
      .regex(/[^a-zA-Z0-9]/, {
        error:
          "Contain at least one special character.",
      }),

    confirmPassword: z
      .string()
      .min(1, {
        error:
          "Confirm your password.",
      }),
  })
  .refine(
    (data) =>
      data.password ===
      data.confirmPassword,
    {
      path: ["confirmPassword"],
      message:
        "Passwords do not match.",
    }
  );

/* ---------------------------------------------------------
   EDIT STUDENT
--------------------------------------------------------- */

export const EditSchemaStudent = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, {
        error:
          "Name must be at least 3 characters long.",
      })
      .regex(/^[A-Za-z ]+$/, {
        error:
          "Name must not contain numbers or special characters.",
      }),

    email: z
      .string()
      .trim()
      .min(1, {
        error: "Email is required.",
      })
      .email({
        error:
          "Please enter a valid email.",
      }),

    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, {
        error:
          "Enter a valid 10-digit phone number.",
      }),

    phone2: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, {
        error:
          "Enter a valid 10-digit phone number.",
      })
      .or(z.literal("")),

    fatherName: z
      .string()
      .trim()
      .min(2, {
        error:
          "Father's name must be at least 2 characters long.",
      })
      .regex(/^[A-Za-z ]+$/, {
        error:
          "Father's name must not contain numbers or special characters.",
      }),

    address: z
      .string()
      .trim()
      .min(5, {
        error:
          "Address must be at least 5 characters long.",
      }),

    batchIds: z
      .array(z.string().min(1))
      .min(1, {
        error:
          "Select at least one batch.",
      }),

    patternIds: z
      .array(z.string().min(1))
      .default([]),

    password: z
      .string()
      .min(8, {
        error:
          "Password must be at least 8 characters.",
      })
      .regex(/[A-Z]/, {
        error:
          "Contain at least one uppercase letter.",
      })
      .regex(/[a-z]/, {
        error:
          "Contain at least one lowercase letter.",
      })
      .regex(/[0-9]/, {
        error:
          "Contain at least one number.",
      })
      .regex(/[^a-zA-Z0-9]/, {
        error:
          "Contain at least one special character.",
      })
      .or(z.literal("")),

    confirmPassword: z
      .string()
      .or(z.literal("")),
  })
  .refine(
    (data) =>
      data.password ===
      data.confirmPassword,
    {
      path: ["confirmPassword"],
      message:
        "Passwords do not match.",
    }
  );

/* =========================================================
   TEACHER SCHEMAS
========================================================= */

/* ---------------------------------------------------------
   CREATE TEACHER
--------------------------------------------------------- */

export const CreateSchemaTeacher = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, {
        error:
          "Name must be at least 3 characters long.",
      })
      .regex(/^[A-Za-z ]+$/, {
        error:
          "Name must not contain numbers or special characters.",
      }),

    email: z
      .string()
      .trim()
      .min(1, {
        error: "Email is required.",
      })
      .email({
        error:
          "Please enter a valid email.",
      }),

    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, {
        error:
          "Enter a valid 10-digit phone number.",
      }),

    branchIds: z
      .array(z.string().min(1))
      .min(1, {
        error:
          "Select at least one branch.",
      }),

    batchIds: z
      .array(z.string().min(1))
      .min(1, {
        error:
          "Select at least one batch.",
      }),

    password: z
      .string()
      .min(8, {
        error:
          "Password must be at least 8 characters.",
      })
      .regex(/[A-Z]/, {
        error:
          "Contain at least one uppercase letter.",
      })
      .regex(/[a-z]/, {
        error:
          "Contain at least one lowercase letter.",
      })
      .regex(/[0-9]/, {
        error:
          "Contain at least one number.",
      })
      .regex(/[^a-zA-Z0-9]/, {
        error:
          "Contain at least one special character.",
      }),

    confirmPassword: z
      .string()
      .min(1, {
        error:
          "Confirm your password.",
      }),
  })
  .refine(
    (data) =>
      data.password ===
      data.confirmPassword,
    {
      path: ["confirmPassword"],
      message:
        "Passwords do not match.",
    }
  );

/* ---------------------------------------------------------
   EDIT TEACHER
--------------------------------------------------------- */

export const EditSchemaTeacher = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, {
        error:
          "Name must be at least 3 characters long.",
      })
      .regex(/^[A-Za-z ]+$/, {
        error:
          "Name must not contain numbers or special characters.",
      }),

    email: z
      .string()
      .trim()
      .min(1, {
        error: "Email is required.",
      })
      .email({
        error:
          "Please enter a valid email.",
      }),

    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, {
        error:
          "Enter a valid 10-digit phone number.",
      }),

    branchIds: z
      .array(z.string().min(1))
      .min(1, {
        error:
          "Select at least one branch.",
      }),

    batchIds: z
      .array(z.string().min(1))
      .min(1, {
        error:
          "Select at least one batch.",
      }),

    password: z
      .string()
      .min(8, {
        error:
          "Password must be at least 8 characters.",
      })
      .regex(/[A-Z]/, {
        error:
          "Contain at least one uppercase letter.",
      })
      .regex(/[a-z]/, {
        error:
          "Contain at least one lowercase letter.",
      })
      .regex(/[0-9]/, {
        error:
          "Contain at least one number.",
      })
      .regex(/[^a-zA-Z0-9]/, {
        error:
          "Contain at least one special character.",
      })
      .or(z.literal("")),

    confirmPassword: z
      .string()
      .or(z.literal("")),
  })
  .refine(
    (data) =>
      data.password ===
      data.confirmPassword,
    {
      path: ["confirmPassword"],
      message:
        "Passwords do not match.",
    }
  );

/* =========================================================
   LOGIN
========================================================= */

export const LoginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .email({
      error:
        "Please enter a valid email.",
    }),

  password: z
    .string()
    .min(1, {
      error:
        "Password is required.",
    }),
});

/* =========================================================
   STUDENT FORM STATE
========================================================= */

export type FormStateRegister = {
  success?: boolean;

  errors?: {
    name?: string[];

    email?: string;
    phone?: string;
    phone2?: string;

    fatherName?: string[];
    address?: string[];

    password?: string[];
    confirmPassword?: string[];

    userId?: string[];

    batchIds?: string[];
    patternIds?: string[];

    role?: string[];
  };

  message?: string;
};

/* =========================================================
   TEACHER FORM STATE
========================================================= */

export type FormStateTeacher = {
  success?: boolean;

  errors?: {
    name?: string[];

    email?: string;
    phone?: string;

    password?: string[];
    confirmPassword?: string[];

    branchIds?: string[];
    batchIds?: string[];

    userId?: string[];
  };

  message?: string;
};

/* =========================================================
   LOGIN STATE
========================================================= */

export type FormStateLogin = {
  errors?: {
    email?: string[];
    password?: string[];
  };

  message?: string;
};