import { Role } from '@/generated/prisma/enums'

import * as z from 'zod'



export const SignupFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .regex(/^[A-Za-z ]+$/, {
        error: "Name must not contain numbers or special characters.",
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

    role: z.literal(Role.STUDENT),

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
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      path: ["confirmPassword"],
      message: "Passwords do not match.",
    }
  );


 
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

export type FormStateLogin =
  | {
      errors?: {
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined
