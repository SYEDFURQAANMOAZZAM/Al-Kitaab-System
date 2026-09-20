"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { normalizeEmail } from "@/lib/auth/email";

import {
  FormStateRegister,
  CreateSchemaStudent,
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
      message: "Invalid batch selection.",
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
     PARSE SUBJECT IDS
  ======================================================= */

  const subjectIds = parseJsonArray(
    formData,
    "subjectIds"
  );

  if (subjectIds === null) {
    return {
      message: "Invalid subject selection.",
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
      subjectIds,
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

        subjectIds:
          fieldErrors.subjectIds,
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

  const uniqueSubjectIds = [
    ...new Set(data.subjectIds),
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

        subjects: {
          select: {
            subjectId: true,
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
     GET AVAILABLE SUBJECTS
  ======================================================= */

  const availableSubjectIds =
    new Set<string>();

  for (const batch of selectedBatches) {
    for (const batchSubject of batch.subjects) {
      availableSubjectIds.add(
        batchSubject.subjectId
      );
    }
  }

  /* =======================================================
     VERIFY SUBJECTS
  ======================================================= */

  const invalidSubjectIds =
    uniqueSubjectIds.filter(
      (subjectId) =>
        !availableSubjectIds.has(
          subjectId
        )
    );

  if (
    invalidSubjectIds.length > 0
  ) {
    return {
      errors: {
        subjectIds: [
          "One or more selected subjects are not available for the selected batches.",
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

              email: normalizeEmail(
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

        await tx.studentEnrollment.createMany({
          data: uniqueBatchIds.map(
            (batchId) => ({
              studentId: student.id,
              batchId,
            })
          ),
        });

        /* -------------------------------------------------
           SUBJECTS
        ------------------------------------------------- */

        if (
          uniqueSubjectIds.length > 0
        ) {
          await tx.studentSubject.createMany({
            data: uniqueSubjectIds.map(
              (subjectId) => ({
                studentId: student.id,
                subjectId,
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