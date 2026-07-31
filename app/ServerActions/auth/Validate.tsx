import { Access, Role } from '@/generated/prisma/enums'

import bcrypt from 'bcryptjs'
import * as z from 'zod'



export const SignupFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .regex(/^[A-Za-z ]+$/, {
        error: "Name must not contain any number or special character.",
      })
      .min(3, { error: "Name must be at least 3 characters long." })
      ,

    email: z
      .email({ error: "Please enter a valid email." })
      .trim(),

    password: z
      .string()
      .min(8, { error: "Be at least 8 characters long." })
      .regex(/[A-Z]/, { error: "Contain at least one uppercase letter." })
      .regex(/[a-z]/, { error: "Contain at least one lowercase letter." })
      .regex(/[0-9]/, { error: "Contain at least one number." })
      .regex(/[^a-zA-Z0-9]/, {
        error: "Contain at least one special character.",
      })
      .trim(),

    confirmPassword: z
      .string()
      .min(1, { error: "Enter correct password." }),

    role: z.enum(Role),

    isaccess: z.enum(Access),

    batch: z.string().min(1, { error: "Batch is required." }),

    branch: z.string().min(1, { error: "Branch is required." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });



 
export type FormStateRegister =
  | {
      errors?: {
        name?: string[]
        email?: string[]
        password?: string[]
        role?: string[];
        isaccess?: string[];
      }
      message?: string
    }
  | undefined

export type FormStateLogin =
  | {
      errors?: {
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined