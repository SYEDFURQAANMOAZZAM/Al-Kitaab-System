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
     PARSE PATTERNS
  ======================================================= */

  const patternIds = parseJsonArray(
    formData,
    "patternIds"
  );

  if (patternIds === null) {
    return {
      errors: {
        patternIds: [
          "Invalid pattern selection.",
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
      patternIds,
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

        patternIds:
          fieldErrors.patternIds,
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

  const uniquePatternIds = [
    ...new Set(data.patternIds),
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

        patterns: {
          select: {
            patternId: true,
          },
        },
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
     GET AVAILABLE PATTERNS
  ======================================================= */

  const availablePatternIds =
    new Set<string>();

  for (const batch of batches) {
    for (const batchPattern of batch.patterns) {
      availablePatternIds.add(
        batchPattern.patternId
      );
    }
  }

  /* =======================================================
     VERIFY PATTERNS
  ======================================================= */

  const invalidPatternIds =
    uniquePatternIds.filter(
      (patternId) =>
        !availablePatternIds.has(
          patternId
        )
    );

  if (
    invalidPatternIds.length > 0
  ) {
    return {
      errors: {
        patternIds: [
          "One or more selected patterns are not available for the selected batches.",
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
        /* -------------------------------------------------
           USER
        ------------------------------------------------- */

        const user =
          await tx.user.create({
            data: {
              name: data.name,

              email: normalizeEmail(
                data.email
              ),

              phone: data.phone,

              password: hashedPassword,

              role: Role.TEACHER,
            },
          });

        /* -------------------------------------------------
           TEACHER
        ------------------------------------------------- */

        const teacher =
          await tx.teacher.create({
            data: {
              userId: user.id,
            },
          });

        /* -------------------------------------------------
           BATCH ASSIGNMENTS
        ------------------------------------------------- */

        await tx.teacherAssignment.createMany({
          data: uniqueBatchIds.map(
            (batchId) => ({
              teacherId: teacher.id,
              batchId,
            })
          ),
        });

        /* -------------------------------------------------
           PATTERN ASSIGNMENTS
        ------------------------------------------------- */

        if (
          uniquePatternIds.length > 0
        ) {
          await tx.teacherPattern.createMany({
            data: uniquePatternIds.map(
              (patternId) => ({
                teacherId: teacher.id,
                patternId,
              })
            ),
          });
        }
      }
    );
  } catch (error) {
    /* =====================================================
       UNIQUE CONSTRAINT
    ===================================================== */

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

  /* =======================================================
     REVALIDATE
  ======================================================= */

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