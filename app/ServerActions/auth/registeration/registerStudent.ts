"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { normalizeEmail } from "@/lib/auth/email";

import {
  FormStateRegister,
  CreateSchemaStudent,
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
    const parsed: unknown =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return null;
    }

    if (
      !parsed.every(
        (value): value is string =>
          typeof value === "string"
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
   CREATE STUDENT
========================================================= */

export async function createStudent(
  _state: FormStateRegister,
  formData: FormData
): Promise<FormStateRegister> {
  /* =======================================================
     AUTHORIZATION
  ======================================================= */

  await requireRoleForAction([
    "ADMIN",
    "TEACHER",
  ]);

  /* =======================================================
     PARSE BATCH IDS
  ======================================================= */

  const batchIds = parseJsonArray(
    formData,
    "batchIds"
  );

  if (batchIds === null) {
    return {
      message:
        "Invalid batch selection.",
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
     PARSE PATTERN IDS
  ======================================================= */

  const patternIds = parseJsonArray(
    formData,
    "patternIds"
  );

  if (patternIds === null) {
    return {
      message:
        "Invalid pattern selection.",
    };
  }

  /* =======================================================
     VALIDATE FORM
  ======================================================= */

  const validatedFields =
    CreateSchemaStudent.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      phone2: formData.get("phone2"),

      password:
        formData.get("password"),

      confirmPassword:
        formData.get("confirmPassword"),

      fatherName:
        formData.get("fatherName"),

      address:
        formData.get("address"),

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

        phone2:
          fieldErrors.phone2?.[0],

        fatherName:
          fieldErrors.fatherName,

        address:
          fieldErrors.address,

        password:
          fieldErrors.password,

        confirmPassword:
          fieldErrors.confirmPassword,

        batchIds:
          fieldErrors.batchIds,

        patternIds:
          fieldErrors.patternIds,
      },
    };
  }

  const data = validatedFields.data;

  /* =======================================================
     NORMALIZE IDS
  ======================================================= */

  const uniqueBatchIds = [
    ...new Set(data.batchIds),
  ];

  const uniquePatternIds = [
    ...new Set(data.patternIds),
  ];

  if (uniqueBatchIds.length === 0) {
    return {
      errors: {
        batchIds: [
          "Select at least one batch.",
        ],
      },
    };
  }

  /* =======================================================
     VERIFY BATCHES
  ======================================================= */

  const selectedBatches =
    await prisma.batch.findMany({
      where: {
        id: {
          in: uniqueBatchIds,
        },
      },

      select: {
        id: true,

        patterns: {
          select: {
            patternId: true,
          },
        },
      },
    });

  if (
    selectedBatches.length !==
    uniqueBatchIds.length
  ) {
    return {
      errors: {
        batchIds: [
          "One or more selected batches are invalid.",
        ],
      },
    };
  }

  /* =======================================================
     GET AVAILABLE PATTERNS
  ======================================================= */

  const availablePatternIds =
    new Set<string>();

  for (const batch of selectedBatches) {
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

  const passwordHash =
    await bcrypt.hash(
      data.password,
      10
    );

  /* =======================================================
     DATABASE TRANSACTION
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

              email:normalizeEmail(
                    data.email
                  ),
               

              phone:
                data.phone || null,

              phone2:
                data.phone2 || null,

              password:
                passwordHash,

              role: "STUDENT",
            },
          });

        /* -------------------------------------------------
           STUDENT
        ------------------------------------------------- */

        const student =
          await tx.student.create({
            data: {
              userId: user.id,

              fatherName:
                data.fatherName,

              Adress:
                data.address,
            },
          });

        /* -------------------------------------------------
           ENROLLMENTS
        ------------------------------------------------- */

        await tx.studentEnrollment.createMany(
          {
            data: uniqueBatchIds.map(
              (batchId) => ({
                studentId: student.id,
                batchId,
              })
            ),
          }
        );

        /* -------------------------------------------------
           PATTERNS
        ------------------------------------------------- */

        if (
          uniquePatternIds.length > 0
        ) {
          await tx.studentPattern.createMany(
            {
              data: uniquePatternIds.map(
                (patternId) => ({
                  studentId: student.id,
                  patternId,
                })
              ),
            }
          );
        }
      }
    );
  } catch (error) {
    /* =====================================================
       UNIQUE CONSTRAINT
    ===================================================== */

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2002") {
        const target =
          Array.isArray(
            error.meta?.target
          )
            ? error.meta.target.join(", ")
            : String(
                error.meta?.target ?? ""
              );

        if (
          target.includes("email")
        ) {
          return {
            errors: {
              email:
                "This email address is already in use.",
            },
          };
        }

        if (
          target.includes("phone")
        ) {
          return {
            errors: {
              phone:
                "This phone number is already in use.",
            },
          };
        }

        return {
          message:
            "A record with the same information already exists.",
        };
      }
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
     SUCCESS
  ======================================================= */

  return {
    success: true,
  };
}