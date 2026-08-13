"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { Role } from "@/generated/prisma/enums";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  FormStateRegister,
  SignupFormSchemaTeacher,
} from "../Validate";

export async function registerTeacher(
  _state: FormStateRegister,
  formData: FormData
) {
  // Only ADMIN can create teachers
  await requireRoleForAction("ADMIN");

  /* ---------------------------------------------
     Parse batches
  --------------------------------------------- */

  let batch: unknown;

  try {
    const rawBatches = formData.get("batch");

    batch = JSON.parse(
      typeof rawBatches === "string"
        ? rawBatches
        : "[]"
    );
  } catch {
    return {
      message: "Select at least one valid batch.",
    };
  }

  /* ---------------------------------------------
     Validate
  --------------------------------------------- */

  const validatedFields =
    SignupFormSchemaTeacher.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),

      password: formData.get("password"),
      confirmPassword:
        formData.get("confirmPassword"),

      // Server-controlled
      role: Role.TEACHER,

      branchId: formData.get("branchId"),
      batch,
    });

  if (!validatedFields.success) {
    return {
      errors:
        validatedFields.error.flatten()
          .fieldErrors,
    };
  }

  const data = validatedFields.data;

  /* ---------------------------------------------
     Remove duplicate batch IDs
  --------------------------------------------- */

  const batchIds = [
    ...new Set(data.batch),
  ];

  /* ---------------------------------------------
     Verify branch + batches
  --------------------------------------------- */

  const [branch, batches] =
    await Promise.all([
      prisma.branch.findUnique({
        where: {
          id: data.branchId,
        },
        select: {
          id: true,
        },
      }),

      prisma.batch.findMany({
        where: {
          id: {
            in: batchIds,
          },
          branchId: data.branchId,
        },
        select: {
          id: true,
        },
      }),
    ]);

  if (
    !branch ||
    batches.length !== batchIds.length
  ) {
    return {
      message:
        "Every selected batch must belong to the selected branch.",
    };
  }

  /* ---------------------------------------------
     Hash password
  --------------------------------------------- */

  const hashedPassword =
    await bcrypt.hash(
      data.password,
      10
    );

  /* ---------------------------------------------
     Create teacher + assignments
  --------------------------------------------- */

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.user.create({
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: hashedPassword,

            // Never trust role from client
            role: Role.TEACHER,

            teacher: {
              create: {
                assignments: {
                  create: batchIds.map(
                    (batchId) => ({
                      batch: {
                        connect: {
                          id: batchId,
                        },
                      },
                    })
                  ),
                },
              },
            },
          },
        });
      }
    );
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        message:
          "Email or phone number already exists.",
      };
    }

    console.error(
      "Unable to create teacher:",
      error
    );

    return {
      message:
        "Unable to create the teacher. Please try again.",
    };
  }

  /* ---------------------------------------------
     Revalidate
  --------------------------------------------- */

  revalidatePath("/Admin/teachers/status");
  revalidatePath("/Admin/branches");

  /* ---------------------------------------------
     Redirect
  --------------------------------------------- */

  redirect("/Admin/teachers/status");
}