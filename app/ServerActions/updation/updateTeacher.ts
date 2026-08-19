"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { normalizeEmail } from "@/lib/auth/email";

import { revalidatePath } from "next/cache";

import {
  FormStateRegister,
  EditSchemaTeacher,
} from "../auth/Validate";

export async function updateTeacher(
  teacherId: string,
  _state: FormStateRegister,
  formData: FormData
) {
  await requireRoleForAction([
    "ADMIN",
    "TEACHER"
  ]);
 

  /* =======================================================
     PARSE BATCHES
  ======================================================= */

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

  /* =======================================================
     VALIDATE
  ======================================================= */

  const validatedFields =
    EditSchemaTeacher.safeParse({
      name: formData.get("name"),
      email: normalizeEmail(String(formData.get("email") ?? "")),
      phone: formData.get("phone"),

      password:
        formData.get("password"),

      confirmPassword:
        formData.get("confirmPassword"),

     

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
     UPDATE
  ======================================================= */

  try {
    await prisma.$transaction(async (tx) => {
      const teacher =
        await tx.teacher.findUnique({
          where: {
            id: teacherId,
          },
          select: {
            userId: true,
          },
        });

      if (!teacher) {
        throw new Error(
          "TEACHER_NOT_FOUND"
        );
      }

      /* -----------------------------------------------
         Update User
      ----------------------------------------------- */

      const userData: Prisma.UserUpdateInput = {
        name: data.name,
        email: data.email,
        phone: data.phone,
      };

      /*
       * Only change password if a new password
       * was actually supplied.
       */
      if (data.password) {
        userData.password =
          await bcrypt.hash(
            data.password,
            10
          );
      }

      await tx.user.update({
        where: {
          id: teacher.userId,
        },
        data: userData,
      });

      /* -----------------------------------------------
         Replace enrollments
      ----------------------------------------------- */

      await tx.teacherAssignment.deleteMany({
        where: {
          teacherId,
        },
      });

      await tx.teacherAssignment.createMany({
        data: batchIds.map(
          (batchId) => ({
            teacherId,
            batchId,
          })
        ),
      });
    });
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

    if (
      error instanceof Error &&
      error.message ===
        "TEACHER_NOT_FOUND"
    ) {
      return {
        message: "Teacher not found.",
      };
    }

    console.error(
      "Unable to update Teacher:",
      error
    );

    return {
      message:
        "Unable to update the teacher. Please try again.",
    };
  }

  /* =======================================================
     CACHE
  ======================================================= */

  revalidatePath(
    "/Admin/teachers/status"
  );

  revalidatePath(
    "/Admin/branches"
  );

  revalidatePath(
    `/Admin/teachers/status/${teacherId}/edit`
  );

  /* =======================================================
     REDIRECT
  ======================================================= */

  return { success: true };
}
