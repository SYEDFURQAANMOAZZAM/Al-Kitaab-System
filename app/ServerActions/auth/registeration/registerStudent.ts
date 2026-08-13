"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { Role } from "@/generated/prisma/enums";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { normalizeEmail } from "@/lib/auth/email";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  FormStateRegister,
  SignupFormSchemaStudent,
} from "../Validate";

export async function registerStudent(
  _state: FormStateRegister,
  formData: FormData
) {
  /* =======================================================
     AUTHORIZATION

     ADMIN  -> can create students
     TEACHER -> can create students
  ======================================================= */

  await requireRoleForAction(
    "ADMIN",
    "TEACHER"
  );

  /* =======================================================
     PARSE BATCHES
  ======================================================= */

  let batch: unknown;

  try {
    const rawBatches =
      formData.get("batch");

    batch = JSON.parse(
      typeof rawBatches === "string"
        ? rawBatches
        : "[]"
    );
  } catch {
    return {
      message:
        "Select at least one valid batch.",
    };
  }

  /* =======================================================
     VALIDATE

     IMPORTANT:
     Role is NOT taken from formData.
  ======================================================= */

  const validatedFields =
    SignupFormSchemaStudent.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),

      password:
        formData.get("password"),

      confirmPassword:
        formData.get("confirmPassword"),

      role: Role.STUDENT,

      branchId:
        formData.get("branchId"),

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

  /* =======================================================
     REMOVE DUPLICATE BATCH IDS
  ======================================================= */

  const batchIds = [
    ...new Set(data.batch),
  ];

  /* =======================================================
     VERIFY BRANCH + BATCHES

     Prevents:

     branch A + batch belonging to branch B
  ======================================================= */

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

  /* =======================================================
     HASH PASSWORD
  ======================================================= */

  const hashedPassword =
    await bcrypt.hash(
      data.password,
      10
    );

  /* =======================================================
     CREATE STUDENT
  ======================================================= */

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.user.create({
          data: {
            name: data.name,
            email: normalizeEmail(data.email),
            phone: data.phone,
            password: hashedPassword,

            /*
             * SERVER-CONTROLLED ROLE
             */
            role: Role.STUDENT,

            student: {
              create: {
                enrollments: {
                  create: batchIds.map(
                    (batchId) => ({
                      batchId,
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
      "Unable to create student:",
      error
    );

    return {
      message:
        "Unable to create the student. Please try again.",
    };
  }

  /* =======================================================
     CACHE
  ======================================================= */

  revalidatePath(
    "/Admin/students/stats"
  );

  revalidatePath(
    "/Admin/branches"
  );

  /* =======================================================
     REDIRECT
  ======================================================= */

  redirect(
    "/Admin/students/stats"
  );
}
