"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { normalizeEmail } from "@/lib/auth/email";

import {
  TEACHER_FIELD_PERMISSIONS,
  type EditorRole,
} from "../auth/teacher-permissions";

import {
  EditSchemaTeacher,
  type FormStateTeacher,
} from "../auth/Validate";

/* =========================================================
   HELPERS
========================================================= */

function parseJsonArray(
  formData: FormData,
  fieldName: string,
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
          value.trim().length > 0,
      )
    ) {
      return null;
    }

    return [...new Set(parsed.map((value) => value.trim()))];
  } catch {
    return null;
  }
}

function sameStringArray(
  a: string[],
  b: string[],
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
   UPDATE TEACHER
========================================================= */

export async function updateTeacher(
  teacherId: string,
  _state: FormStateTeacher,
  formData: FormData,
): Promise<FormStateTeacher> {
  /* =======================================================
     AUTHORIZATION
  ======================================================= */

  const session = await AuthVerify(
    "ADMIN",
    "TEACHER",
  );

  const editorRole = session.role as EditorRole;

  const permissions =
    TEACHER_FIELD_PERMISSIONS[editorRole];

  /* =======================================================
     VALIDATE TEACHER ID
  ======================================================= */

  if (
    typeof teacherId !== "string" ||
    !teacherId.trim()
  ) {
    return {
      message: "Invalid teacher ID.",
    };
  }

  /* =======================================================
     FIND EXISTING TEACHER
  ======================================================= */

  const existingTeacher =
    await prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },

      select: {
        id: true,
        userId: true,

        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },

        assignments: {
          select: {
            batchId: true,
          },
        },

        teacherSubjects: {
          select: {
            subjectId: true,
          },
        },
      },
    });

  /* =======================================================
     VERIFY TEACHER
  ======================================================= */

  if (
    !existingTeacher ||
    existingTeacher.user.role !== "TEACHER"
  ) {
    return {
      message: "Teacher not found.",
    };
  }

  /* =======================================================
     TEACHER OWNERSHIP
  ======================================================= */

  if (
    editorRole === "TEACHER" &&
    session.id !== existingTeacher.user.id
  ) {
    return {
      message:
        "You are not allowed to edit this teacher.",
    };
  }

  /* =======================================================
     EXISTING RELATIONS
  ======================================================= */

  const existingBatchIds =
    existingTeacher.assignments.map(
      (assignment) => assignment.batchId,
    );

  const existingSubjectIds =
    existingTeacher.teacherSubjects.map(
      (teacherSubject) => teacherSubject.subjectId,
    );

  /* =======================================================
     PARSE BRANCH IDS
  ======================================================= */

  const submittedBranchIds =
    parseJsonArray(
      formData,
      "branchIds",
    );

  if (submittedBranchIds === null) {
    return {
      errors: {
        branchIds: [
          "Invalid branch selection.",
        ],
      },
    };
  }

  const uniqueBranchIds = [
    ...new Set(submittedBranchIds),
  ];

  if (uniqueBranchIds.length === 0) {
    return {
      errors: {
        branchIds: [
          "Select at least one branch.",
        ],
      },
    };
  }

  /* =======================================================
     PARSE BATCH IDS
  ======================================================= */

  const submittedBatchIds =
    parseJsonArray(
      formData,
      "batchIds",
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
     PARSE SUBJECT IDS
  ======================================================= */

  const submittedSubjectIds =
    parseJsonArray(
      formData,
      "subjectIds",
    );

  if (submittedSubjectIds === null) {
    return {
      errors: {
        subjectIds: [
          "Invalid subject selection.",
        ],
      },
    };
  }

  const uniqueSubjectIds = [
    ...new Set(submittedSubjectIds),
  ];

  /* =======================================================
     DETECT UNAUTHORIZED CHANGES
  ======================================================= */

  if (editorRole === "TEACHER") {
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
            existingTeacher.user.email,
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
       BATCHES
    ------------------------------------------------------- */

    if (!permissions.batches) {
      if (
        !sameStringArray(
          uniqueBatchIds,
          existingBatchIds,
        )
      ) {
        return {
          errors: {
            batchIds: [
              "You are not allowed to modify batches.",
            ],
          },
        };
      }
    }

    /* -------------------------------------------------------
       SUBJECTS
    ------------------------------------------------------- */

    if (!permissions.subjects) {
      if (
        !sameStringArray(
          uniqueSubjectIds,
          existingSubjectIds,
        )
      ) {
        return {
          errors: {
            subjectIds: [
              "You are not allowed to modify subjects.",
            ],
          },
        };
      }
    }
  }

  /* =======================================================
     EFFECTIVE BATCH VALUES
  ======================================================= */

  const effectiveBatchIds =
    permissions.batches
      ? uniqueBatchIds
      : existingBatchIds;

  /* =======================================================
     EFFECTIVE SUBJECT VALUES
  ======================================================= */

  const effectiveSubjectIds =
    permissions.subjects
      ? uniqueSubjectIds
      : existingSubjectIds;

  /* =======================================================
     BASIC VALIDATION
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
     VALIDATE SELECTED BATCHES
  ======================================================= */

  let selectedBatches: {
    id: string;
    branchId: string;
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
          branchId: true,
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

    /* -------------------------------------------------------
       VALIDATE BRANCHES
    ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       VERIFY BATCH → BRANCH RELATION
    ------------------------------------------------------- */

    const invalidBatch =
      selectedBatches.some(
        (batch) =>
          !uniqueBranchIds.includes(
            batch.branchId,
          ),
      );

    if (invalidBatch) {
      return {
        errors: {
          batchIds: [
            "One or more selected batches do not belong to the selected branches.",
          ],
        },
      };
    }
  }

  /* =======================================================
     VALIDATE SELECTED SUBJECTS
  ======================================================= */

  if (permissions.subjects) {
    if (effectiveSubjectIds.length > 0) {
      /* -----------------------------------------------------
         VERIFY SUBJECTS EXIST
      ----------------------------------------------------- */

      const subjectCount =
        await prisma.subject.count({
          where: {
            id: {
              in: effectiveSubjectIds,
            },
          },
        });

      if (
        subjectCount !==
        effectiveSubjectIds.length
      ) {
        return {
          errors: {
            subjectIds: [
              "One or more selected subjects are invalid.",
            ],
          },
        };
      }

      /* -----------------------------------------------------
         VERIFY SUBJECTS BELONG TO SELECTED BATCHES
      ----------------------------------------------------- */

      const availableBatchSubjects =
        await prisma.batchSubject.findMany({
          where: {
            batchId: {
              in: effectiveBatchIds,
            },

            subjectId: {
              in: effectiveSubjectIds,
            },
          },

          select: {
            subjectId: true,
          },
        });

      const availableSubjectIds =
        new Set(
          availableBatchSubjects.map(
            (item) => item.subjectId,
          ),
        );

      const invalidSubjectIds =
        effectiveSubjectIds.filter(
          (subjectId) =>
            !availableSubjectIds.has(
              subjectId,
            ),
        );

      if (invalidSubjectIds.length > 0) {
        return {
          errors: {
            subjectIds: [
              "One or more selected subjects are not available for the selected batches.",
            ],
          },
        };
      }
    }
  }

  /* =======================================================
     VALIDATE FORM
  ======================================================= */

  const validatedFields =
    EditSchemaTeacher.safeParse({
      name: formData.get("name"),

      email: permissions.email
        ? formData.get("email")
        : existingTeacher.user.email,

      phone: permissions.phone
        ? formData.get("phone")
        : existingTeacher.user.phone,

      password: permissions.password
        ? formData.get("password")
        : "",

      confirmPassword:
        permissions.password
          ? formData.get("confirmPassword")
          : "",

      /*
       * IMPORTANT:
       * Zod expects arrays here.
       * FormData gives us JSON strings,
       * so we pass the parsed arrays.
       */
      branchIds: uniqueBranchIds,
      batchIds: effectiveBatchIds,
      subjectIds: effectiveSubjectIds,
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

        subjectIds:
          fieldErrors.subjectIds,
      },
    };
  }

  const data = validatedFields.data;

  /* =======================================================
     DATABASE TRANSACTION
  ======================================================= */

  try {
    await prisma.$transaction(
      async (tx) => {
        /* ---------------------------------------------------
           RE-CHECK TEACHER
        --------------------------------------------------- */

        const teacher =
          await tx.teacher.findUnique({
            where: {
              id: existingTeacher.id,
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
          !teacher ||
          teacher.user.role !== "TEACHER"
        ) {
          throw new Error(
            "TEACHER_NOT_FOUND",
          );
        }

        /* ---------------------------------------------------
           RE-CHECK OWNERSHIP
        --------------------------------------------------- */

        if (
          editorRole === "TEACHER" &&
          session.id !== teacher.user.id
        ) {
          throw new Error(
            "UNAUTHORIZED_TEACHER",
          );
        }

        /* ---------------------------------------------------
           USER DATA
        --------------------------------------------------- */

        const userData:
          Prisma.UserUpdateInput = {};

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
              10,
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
              id: teacher.userId,
            },

            data: userData,
          });
        }

        /* ---------------------------------------------------
           TEACHER ASSIGNMENTS
        --------------------------------------------------- */

        if (permissions.batches) {
          await tx.teacherAssignment.deleteMany({
            where: {
              teacherId: teacher.id,
            },
          });

          if (
            effectiveBatchIds.length > 0
          ) {
            await tx.teacherAssignment.createMany({
              data: effectiveBatchIds.map(
                (batchId) => ({
                  teacherId: teacher.id,
                  batchId,
                }),
              ),
            });
          }
        }

        /* ---------------------------------------------------
           TEACHER SUBJECTS
        --------------------------------------------------- */

        if (permissions.subjects) {
          await tx.teacherSubject.deleteMany({
            where: {
              teacherId: teacher.id,
            },
          });

          if (
            effectiveSubjectIds.length > 0
          ) {
            await tx.teacherSubject.createMany({
              data: effectiveSubjectIds.map(
                (subjectId) => ({
                  teacherId: teacher.id,
                  subjectId,
                }),
              ),
            });
          }
        }
      },
    );
  } catch (error) {
    /* =====================================================
       UNAUTHORIZED TEACHER
    ===================================================== */

    if (
      error instanceof Error &&
      error.message ===
        "UNAUTHORIZED_TEACHER"
    ) {
      return {
        message:
          "You are not allowed to edit this teacher.",
      };
    }

    /* =====================================================
       TEACHER NOT FOUND
    ===================================================== */

    if (
      error instanceof Error &&
      error.message ===
        "TEACHER_NOT_FOUND"
    ) {
      return {
        message: "Teacher not found.",
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
            error.meta?.target,
          )
            ? error.meta.target.join(", ")
            : String(
                error.meta?.target ?? "",
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
            "A teacher with the same information already exists.",
        };
      }

      /* ---------------------------------------------------
         RECORD NOT FOUND
      --------------------------------------------------- */

      if (error.code === "P2025") {
        return {
          message:
            "Teacher could not be found.",
        };
      }
    }

    /* =====================================================
       UNKNOWN ERROR
    ===================================================== */

    console.error(
      "Unable to update teacher:",
      error,
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
    "/Admin/teachers/status",
  );

  revalidatePath(
    "/Admin/branches",
  );

  revalidatePath(
    `/Admin/teachers/status/${teacherId}/edit`,
  );

  /* =======================================================
     SUCCESS
  ======================================================= */

  return {
    success: true,
  };
}