"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { Role } from "@/generated/prisma/enums";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { normalizeEmail } from "@/lib/auth/email";

import { revalidatePath } from "next/cache";

import {
  FormStateTeacher,
  CreateSchemaTeacher,
} from "../Validate";

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
   REGISTER TEACHER
========================================================= */

export async function registerTeacher(
  _state: FormStateTeacher,
  formData: FormData
): Promise<FormStateTeacher> {
  await requireRoleForAction(["ADMIN"]);

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
    CreateSchemaTeacher.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),

      password: formData.get("password"),
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
     REMOVE DUPLICATES
  ======================================================= */

  const uniqueBranchIds = [
    ...new Set(data.branchIds),
  ];

  const uniqueBatchIds = [
    ...new Set(data.batchIds),
  ];

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
     HASH PASSWORD
  ======================================================= */

  const hashedPassword =
    await bcrypt.hash(
      data.password,
      10
    );

  /* =======================================================
     CREATE
  ======================================================= */

  try {
    await prisma.$transaction(
      async (tx) => {
        const user =
          await tx.user.create({
            data: {
              name: data.name,

              email: normalizeEmail(
                    data.email
                  ),

              phone: data.phone,

              password:
                hashedPassword,

              role: Role.TEACHER,
            },
          });

        const teacher =
          await tx.teacher.create({
            data: {
              userId: user.id,
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
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
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

    console.error(
      "Unable to create teacher:",
      error
    );

    return {
      message:
        "Unable to create the teacher. Please try again.",
    };
  }

  revalidatePath(
    "/Admin/teachers/status"
  );

  revalidatePath(
    "/Admin/branches"
  );

  return {
    success: true,
  };
}