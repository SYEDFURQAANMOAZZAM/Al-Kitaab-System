"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { normalizeEmail } from "@/lib/auth/email";

import {
  FormStateRegister,
  EditSchemaStudent,
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
   UPDATE STUDENT
========================================================= */

export async function updateStudent(
  userId: string,
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
     VALIDATE USER ID
  ======================================================= */

  if (
    typeof userId !== "string" ||
    !userId.trim()
  ) {
    return {
      message: "Invalid student ID.",
    };
  }

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

  /* =======================================================
     PARSE PATTERN IDS
  ======================================================= */

  const patternIds = parseJsonArray(
    formData,
    "patternIds"
  );

  if (patternIds === null) {
    return {
      message: "Invalid pattern selection.",
    };
  }

  /* =======================================================
     VALIDATE FORM
  ======================================================= */

  const validatedFields =
    EditSchemaStudent.safeParse({
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
     VERIFY STUDENT + BATCHES
  ======================================================= */

  const [student, selectedBatches] =
    await Promise.all([
      prisma.student.findUnique({
        where: {
          userId,
        },
        select: {
          id: true,

          user: {
            select: {
              role: true,
            },
          },
        },
      }),

      prisma.batch.findMany({
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
      }),
    ]);

  /* =======================================================
     VERIFY STUDENT
  ======================================================= */

  if (
    !student ||
    student.user.role !== "STUDENT"
  ) {
    return {
      message: "Student not found.",
    };
  }

  /* =======================================================
     VERIFY BATCHES
  ======================================================= */

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
     COLLECT AVAILABLE PATTERNS
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
     VERIFY SELECTED PATTERNS
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
     UPDATE
  ======================================================= */

  try {
    await prisma.$transaction(
      async (tx) => {
        /* ---------------------------------------------------
           RE-CHECK STUDENT
        --------------------------------------------------- */

        const existingStudent =
          await tx.student.findUnique({
            where: {
              id: student.id,
            },

            select: {
              id: true,
              userId: true,
            },
          });

        if (!existingStudent) {
          throw new Error(
            "STUDENT_NOT_FOUND"
          );
        }

        /* ---------------------------------------------------
           USER DATA
        --------------------------------------------------- */

        const userData: Prisma.UserUpdateInput =
          {
            name: data.name,

            email:  normalizeEmail(
                  data.email
                ),

            phone:
              data.phone || null,

            phone2:
              data.phone2 || null,
          };

        /* ---------------------------------------------------
           PASSWORD
        --------------------------------------------------- */

        if (data.password) {
          userData.password =
            await bcrypt.hash(
              data.password,
              10
            );
        }

        /* ---------------------------------------------------
           UPDATE USER
        --------------------------------------------------- */

        await tx.user.update({
          where: {
            id: existingStudent.userId,
          },

          data: userData,
        });

        /* ---------------------------------------------------
           UPDATE STUDENT DETAILS
        --------------------------------------------------- */

        await tx.student.update({
          where: {
            id: existingStudent.id,
          },

          data: {
            fatherName:
              data.fatherName,

            Adress:
              data.address,
          },
        });

        /* ---------------------------------------------------
           REPLACE BATCH ENROLLMENTS
        --------------------------------------------------- */

        await tx.studentEnrollment.deleteMany({
          where: {
            studentId:
              existingStudent.id,
          },
        });

        await tx.studentEnrollment.createMany({
          data: uniqueBatchIds.map(
            (batchId) => ({
              studentId:
                existingStudent.id,

              batchId,
            })
          ),
        });

        /* ---------------------------------------------------
           REPLACE STUDENT PATTERNS
        --------------------------------------------------- */

        await tx.studentPattern.deleteMany({
          where: {
            studentId:
              existingStudent.id,
          },
        });

        if (
          uniquePatternIds.length > 0
        ) {
          await tx.studentPattern.createMany({
            data: uniquePatternIds.map(
              (patternId) => ({
                studentId:
                  existingStudent.id,

                patternId,
              })
            ),
          });
        }
      }
    );
  } catch (error) {
    /* =====================================================
       PRISMA ERRORS
    ===================================================== */

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      /* ---------------------------------------------------
         DUPLICATE UNIQUE VALUE
      --------------------------------------------------- */

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

      /* ---------------------------------------------------
         RECORD NOT FOUND
      --------------------------------------------------- */

      if (error.code === "P2025") {
        return {
          message:
            "Student could not be found.",
        };
      }
    }

    /* =====================================================
       CUSTOM ERROR
    ===================================================== */

    if (
      error instanceof Error &&
      error.message ===
        "STUDENT_NOT_FOUND"
    ) {
      return {
        message: "Student not found.",
      };
    }

    /* =====================================================
       UNKNOWN ERROR
    ===================================================== */

    console.error(
      "Unable to update student:",
      error
    );

    return {
      message:
        "Unable to update the student. Please try again.",
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

  revalidatePath(
    `/Admin/students/stats/${userId}/edit`
  );

  /* =======================================================
     SUCCESS
  ======================================================= */

  return {
    success: true,
  };
}