"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { normalizeEmail } from "@/lib/auth/email";

import {
  STUDENT_FIELD_PERMISSIONS,
  type EditorRole,
} from "../auth/student-permissions";

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
   NORMALIZE STRING FOR COMPARISON
========================================================= */

function normalizeValue(
  value: string | null | undefined
): string {
  return (value ?? "").trim();
}

/* =========================================================
   COMPARE STRING ARRAYS
========================================================= */

function sameStringArray(
  a: string[],
  b: string[]
): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const setA = new Set(a);
  const setB = new Set(b);

  if (setA.size !== setB.size) {
    return false;
  }

  for (const value of setA) {
    if (!setB.has(value)) {
      return false;
    }
  }

  return true;
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

  const session = await AuthVerify(
    "ADMIN",
    "TEACHER",
    "STUDENT"
  );

  const editorRole = session.role as EditorRole;

  const permissions =
    STUDENT_FIELD_PERMISSIONS[editorRole];

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
     FIND EXISTING STUDENT
  ======================================================= */

  const existingStudent =
    await prisma.student.findUnique({
      where: {
        userId,
      },

      select: {
        id: true,
        userId: true,
        fatherName: true,
        Adress: true,

        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            phone2: true,
            role: true,
          },
        },

        enrollments: {
          select: {
            batchId: true,
          },
        },

        studentPatterns: {
          select: {
            patternId: true,
          },
        },
      },
    });

  /* =======================================================
     VERIFY STUDENT
  ======================================================= */

  if (
    !existingStudent ||
    existingStudent.user.role !== "STUDENT"
  ) {
    return {
      message: "Student not found.",
    };
  }

  /* =======================================================
     STUDENT OWNERSHIP
     
     STUDENT can only edit their own account.
  ======================================================= */

  if (
    editorRole === "STUDENT" &&
    session.id !== existingStudent.user.id
  ) {
    return {
      message:
        "You are not allowed to edit this student.",
    };
  }

  /* =======================================================
     EXISTING RELATIONS
  ======================================================= */

  const existingBatchIds =
    existingStudent.enrollments.map(
      (enrollment) => enrollment.batchId
    );

  const existingPatternIds =
    existingStudent.studentPatterns.map(
      (studentPattern) =>
        studentPattern.patternId
    );

  /* =======================================================
     PARSE BATCH IDS
     
     We parse these even for STUDENT so that we can detect
     an attempt to modify a restricted field.
  ======================================================= */

  const submittedBatchIds =
    parseJsonArray(
      formData,
      "batchIds"
    );

  if (submittedBatchIds === null) {
    return {
      errors: {
        batchIds: [
          "Invalid batch selection.",
        ],
      },
    };
  }

  const uniqueBatchIds = [
    ...new Set(submittedBatchIds),
  ];

  /* =======================================================
     PARSE PATTERN IDS
  ======================================================= */

  const submittedPatternIds =
    parseJsonArray(
      formData,
      "patternIds"
    );

  if (submittedPatternIds === null) {
    return {
      errors: {
        patternIds: [
          "Invalid pattern selection.",
        ],
      },
    };
  }

  const uniquePatternIds = [
    ...new Set(submittedPatternIds),
  ];

  /* =======================================================
     DETECT UNAUTHORIZED CHANGES
     
     IMPORTANT:
     This happens BEFORE any database mutation.

     If a STUDENT changes a restricted field:
       -> return error
       -> transaction never starts
       -> database remains unchanged
  ======================================================= */

  if (editorRole === "STUDENT") {
    /* -------------------------------------------------------
       EMAIL
    ------------------------------------------------------- */

    if (!permissions.email) {
      const submittedEmail =
        formData.get("email");

      if (
        typeof submittedEmail !== "string" ||
        normalizeEmail(submittedEmail) !==
          normalizeEmail(
            existingStudent.user.email
          )
      ) {
        return {
          errors: {
            email:
              "You are not allowed to modify your email.",
          },
        };
      }
    }

    /* -------------------------------------------------------
       PHONE
    ------------------------------------------------------- */

    if (!permissions.phone) {
      const submittedPhone =
        formData.get("phone");

      if (
        typeof submittedPhone !== "string" ||
        normalizeValue(submittedPhone) !==
          normalizeValue(
            existingStudent.user.phone
          )
      ) {
        return {
          errors: {
            phone:
              "You are not allowed to modify your phone number.",
          },
        };
      }
    }

    /* -------------------------------------------------------
       FATHER NAME
    ------------------------------------------------------- */

    if (!permissions.fatherName) {
      const submittedFatherName =
        formData.get("fatherName");

      if (
        typeof submittedFatherName !==
          "string" ||
        normalizeValue(
          submittedFatherName
        ) !==
          normalizeValue(
            existingStudent.fatherName
          )
      ) {
        return {
          errors: {
            fatherName:[
              "You are not allowed to modify the father's name.",
            ]
          },
        };
      }
    }

    /* -------------------------------------------------------
       ADDRESS
    ------------------------------------------------------- */

    if (!permissions.address) {
      const submittedAddress =
        formData.get("address");

      if (
        typeof submittedAddress !==
          "string" ||
        normalizeValue(
          submittedAddress
        ) !==
          normalizeValue(
            existingStudent.Adress
          )
      ) {
        return {
          errors: {
            address:[
              "You are not allowed to modify the address.",
            ]
          },
        };
      }
    }

    /* -------------------------------------------------------
       BATCHES
    ------------------------------------------------------- */

    if (!permissions.batches) {
      if (
        !sameStringArray(
          uniqueBatchIds,
          existingBatchIds
        )
      ) {
        return {
          errors: {
            batchIds:
              [
                "You are not allowed to modify batches.",
              ],
          },
        };
      }
    }

    /* -------------------------------------------------------
       PATTERNS
    ------------------------------------------------------- */

    if (!permissions.patterns) {
      if (
        !sameStringArray(
          uniquePatternIds,
          existingPatternIds
        )
      ) {
        return {
          errors: {
            patternIds:
              [
                "You are not allowed to modify patterns.",
              ],
          },
        };
      }
    }
  }

  /* =======================================================
     DETERMINE EFFECTIVE VALUES
     
     At this point:
       - Admin/Teacher -> submitted values
       - Student -> restricted values are guaranteed
         unchanged
  ======================================================= */

  const effectiveBatchIds =
    permissions.batches
      ? uniqueBatchIds
      : existingBatchIds;

  const effectivePatternIds =
    permissions.patterns
      ? uniquePatternIds
      : existingPatternIds;

  /* =======================================================
     BATCH VALIDATION
  ======================================================= */

  if (
    permissions.batches &&
    effectiveBatchIds.length === 0
  ) {
    return {
      errors: {
        batchIds: [
          "Select at least one batch.",
        ],
      },
    };
  }

  /* =======================================================
     VALIDATE FORM
  ======================================================= */

  const validatedFields =
    EditSchemaStudent.safeParse({
      name: formData.get("name"),

      email: permissions.email
        ? formData.get("email")
        : existingStudent.user.email,

      phone: permissions.phone
        ? formData.get("phone")
        : existingStudent.user.phone,

      phone2: formData.get("phone2"),

      password: permissions.password
        ? formData.get("password")
        : "",

      confirmPassword:
        permissions.password
          ? formData.get("confirmPassword")
          : "",

      fatherName:
        permissions.fatherName
          ? formData.get("fatherName")
          : existingStudent.fatherName,

      address: permissions.address
        ? formData.get("address")
        : existingStudent.Adress,

      batchIds: effectiveBatchIds,

      patternIds: effectivePatternIds,
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
     VERIFY SELECTED BATCHES
     
     Only necessary when batches are editable.
  ======================================================= */

  let selectedBatches: {
    id: string;
    patterns: {
      patternId: string;
    }[];
  }[] = [];

  if (permissions.batches) {
    selectedBatches =
      await prisma.batch.findMany({
        where: {
          id: {
            in: effectiveBatchIds,
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
      effectiveBatchIds.length
    ) {
      return {
        errors: {
          batchIds: [
            "One or more selected batches are invalid.",
          ],
        },
      };
    }
  }

  /* =======================================================
     VERIFY PATTERNS
  ======================================================= */

  if (permissions.patterns) {
    /*
     * If batches are editable, use the newly selected
     * batches.
     *
     * If batches are not editable, use existing batches.
     */

    if (!permissions.batches) {
      selectedBatches =
        await prisma.batch.findMany({
          where: {
            id: {
              in: existingBatchIds,
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
    }

    const availablePatternIds =
      new Set<string>();

    for (const batch of selectedBatches) {
      for (const batchPattern of batch.patterns) {
        availablePatternIds.add(
          batchPattern.patternId
        );
      }
    }

    const invalidPatternIds =
      effectivePatternIds.filter(
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
  }

  /* =======================================================
     DATABASE TRANSACTION
     
     Everything below is atomic.

     If ANY operation throws:
       -> Prisma rolls back ALL changes.
  ======================================================= */

  try {
    await prisma.$transaction(
      async (tx) => {
        /* ---------------------------------------------------
           RE-CHECK STUDENT
        --------------------------------------------------- */

        const student =
          await tx.student.findUnique({
            where: {
              id: existingStudent.id,
            },

            select: {
              id: true,
              userId: true,

              user: {
                select: {
                  id: true,
                  role: true,
                },
              },
            },
          });

        if (
          !student ||
          student.user.role !== "STUDENT"
        ) {
          throw new Error(
            "STUDENT_NOT_FOUND"
          );
        }

        /* ---------------------------------------------------
           RE-CHECK OWNERSHIP INSIDE TRANSACTION
           
           This prevents the authorization assumption from
           becoming stale between the initial query and update.
        --------------------------------------------------- */

        if (
          editorRole === "STUDENT" &&
          session.id !== student.user.id
        ) {
          throw new Error(
            "UNAUTHORIZED_STUDENT"
          );
        }

        /* ---------------------------------------------------
           USER DATA
        --------------------------------------------------- */

        const userData: Prisma.UserUpdateInput =
          {};

        if (permissions.name) {
          userData.name = data.name;
        }

        if (permissions.email) {
          userData.email =
            normalizeEmail(data.email);
        }

        if (permissions.phone) {
          userData.phone =
            data.phone || null;
        }

        if (permissions.phone2) {
          userData.phone2 =
            data.phone2 || null;
        }

        /* ---------------------------------------------------
           PASSWORD
        --------------------------------------------------- */

        if (
          permissions.password &&
          data.password
        ) {
          userData.password =
            await bcrypt.hash(
              data.password,
              10
            );
        }

        /* ---------------------------------------------------
           UPDATE USER
        --------------------------------------------------- */

        if (
          Object.keys(userData).length > 0
        ) {
          await tx.user.update({
            where: {
              id: student.userId,
            },

            data: userData,
          });
        }

        /* ---------------------------------------------------
           STUDENT DATA
        --------------------------------------------------- */

        const studentData:
          Prisma.StudentUpdateInput = {};

        if (permissions.fatherName) {
          studentData.fatherName =
            data.fatherName;
        }

        if (permissions.address) {
          studentData.Adress =
            data.address;
        }

        if (
          Object.keys(studentData).length > 0
        ) {
          await tx.student.update({
            where: {
              id: student.id,
            },

            data: studentData,
          });
        }

        /* ---------------------------------------------------
           BATCHES
           
           Only when permitted.
        --------------------------------------------------- */

        if (permissions.batches) {
          await tx.studentEnrollment.deleteMany({
            where: {
              studentId: student.id,
            },
          });

          await tx.studentEnrollment.createMany({
            data: effectiveBatchIds.map(
              (batchId) => ({
                studentId: student.id,
                batchId,
              })
            ),
          });
        }

        /* ---------------------------------------------------
           PATTERNS
           
           Only when permitted.
        --------------------------------------------------- */

        if (permissions.patterns) {
          await tx.studentPattern.deleteMany({
            where: {
              studentId: student.id,
            },
          });

          if (
            effectivePatternIds.length > 0
          ) {
            await tx.studentPattern.createMany({
              data: effectivePatternIds.map(
                (patternId) => ({
                  studentId: student.id,
                  patternId,
                })
              ),
            });
          }
        }
      }
    );
  } catch (error) {
    /* =====================================================
       UNAUTHORIZED STUDENT
    ===================================================== */

    if (
      error instanceof Error &&
      error.message ===
        "UNAUTHORIZED_STUDENT"
    ) {
      return {
        message:
          "You are not allowed to edit this student.",
      };
    }

    /* =====================================================
       STUDENT NOT FOUND
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