"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { normalizeEmail } from "@/lib/auth/email";

import { revalidatePath } from "next/cache";

import {
  FormStateTeacher,
  EditSchemaTeacher,
} from "../auth/Validate";

/* =========================================================
   PARSE JSON ARRAY
========================================================= */

function parseJsonArray(
  formData: FormData,
  fieldName: string
): string[] | null {
  const raw = formData.get(fieldName);

  if (typeof raw !== "string") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return null;
    }

    if (
      !parsed.every(
        (value): value is string =>
          typeof value === "string" &&
          value.trim().length > 0
      )
    ) {
      return null;
    }

    return [...new Set(parsed)];
  } catch {
    return null;
  }
}

/* =========================================================
   UPDATE TEACHER
========================================================= */

export async function updateTeacher(
  teacherId: string,
  _state: FormStateTeacher,
  formData: FormData
): Promise<FormStateTeacher> {
  await requireRoleForAction([
    "ADMIN",
    "TEACHER",
  ]);

  /* =======================================================
     PARSE BRANCHES
  ======================================================= */

  const branchIds = parseJsonArray(
    formData,
    "branchIds"
  );

  if (branchIds === null) {
    return {
      errors: {
        branchIds: [
          "Invalid branch selection.",
        ],
      },
    };
  }

  if (branchIds.length === 0) {
    return {
      errors: {
        branchIds: [
          "Select at least one branch.",
        ],
      },
    };
  }

  /* =======================================================
     PARSE BATCHES
  ======================================================= */

  const batchIds = parseJsonArray(
    formData,
    "batchIds"
  );

  if (batchIds === null) {
    return {
      errors: {
        batchIds: [
          "Invalid batch selection.",
        ],
      },
    };
  }

  if (batchIds.length === 0) {
    return {
      errors: {
        batchIds: [
          "Select at least one batch.",
        ],
      },
    };
  }

  /* =======================================================
     VALIDATE
  ======================================================= */

  const validatedFields =
    EditSchemaTeacher.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),

      password:
        formData.get("password"),

      confirmPassword:
        formData.get("confirmPassword"),

      branchIds,
      batchIds,
    });

  if (!validatedFields.success) {
    const fieldErrors =
      validatedFields.error.flatten()
        .fieldErrors;

    return {
      errors: {
        name: fieldErrors.name,

        email:
          fieldErrors.email?.[0],

        phone:
          fieldErrors.phone?.[0],

        password:
          fieldErrors.password,

        confirmPassword:
          fieldErrors.confirmPassword,

        branchIds:
          fieldErrors.branchIds,

        batchIds:
          fieldErrors.batchIds,
      },
    };
  }

  const data = validatedFields.data;

  /* =======================================================
     NORMALIZE
  ======================================================= */

  const uniqueBranchIds = [
    ...new Set(data.branchIds),
  ];

  const uniqueBatchIds = [
    ...new Set(data.batchIds),
  ];

  /* =======================================================
     VERIFY TEACHER
  ======================================================= */

  const teacher =
    await prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },
      select: {
        id: true,
        userId: true,
      },
    });

  if (!teacher) {
    return {
      message: "Teacher not found.",
    };
  }

  /* =======================================================
     VERIFY BRANCHES
  ======================================================= */

  const branches =
    await prisma.branch.findMany({
      where: {
        id: {
          in: uniqueBranchIds,
        },
      },
      select: {
        id: true,
      },
    });

  if (
    branches.length !==
    uniqueBranchIds.length
  ) {
    return {
      errors: {
        branchIds: [
          "One or more selected branches are invalid.",
        ],
      },
    };
  }

  /* =======================================================
     VERIFY BATCHES
  ======================================================= */

  const batches =
    await prisma.batch.findMany({
      where: {
        id: {
          in: uniqueBatchIds,
        },
        branchId: {
          in: uniqueBranchIds,
        },
      },
      select: {
        id: true,
        branchId: true,
      },
    });

  if (
    batches.length !==
    uniqueBatchIds.length
  ) {
    return {
      errors: {
        batchIds: [
          "One or more selected batches do not belong to the selected branches.",
        ],
      },
    };
  }

  /* =======================================================
     UPDATE
  ======================================================= */

  try {
    await prisma.$transaction(
      async (tx) => {
        /* -----------------------------------------------
           USER
        ------------------------------------------------ */

        const userData: Prisma.UserUpdateInput = {
          name: data.name,

          email:  normalizeEmail(data.email),

          phone: data.phone,
        };

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
           REPLACE ASSIGNMENTS
        ------------------------------------------------ */

        await tx.teacherAssignment.deleteMany({
          where: {
            teacherId: teacher.id,
          },
        });

        await tx.teacherAssignment.createMany({
          data: uniqueBatchIds.map(
            (batchId) => ({
              teacherId: teacher.id,
              batchId,
            })
          ),
        });
      }
    );
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2002") {
        const target =
          Array.isArray(error.meta?.target)
            ? error.meta.target.join(", ")
            : String(
                error.meta?.target ?? ""
              );

        if (target.includes("email")) {
          return {
            errors: {
              email:
                "This email address is already in use.",
            },
          };
        }

        if (target.includes("phone")) {
          return {
            errors: {
              phone:
                "This phone number is already in use.",
            },
          };
        }

        return {
          message:
            "A teacher with the same information already exists.",
        };
      }

      if (error.code === "P2025") {
        return {
          message:
            "Teacher or related record was not found.",
        };
      }
    }

    console.error(
      "Unable to update teacher:",
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

  return {
    success: true,
  };
}