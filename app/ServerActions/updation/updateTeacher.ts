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

    return [
      ...new Set(
        parsed.map((value) => value.trim())
      ),
    ];
  } catch {
    return null;
  }
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
   UPDATE TEACHER
========================================================= */

export async function updateTeacher(
  teacherId: string,
  _state: FormStateTeacher,
  formData: FormData
): Promise<FormStateTeacher> {
  /* =======================================================
     AUTHORIZATION
  ======================================================= */

  const session = await AuthVerify(
    "ADMIN",
    "TEACHER"
  );

  /*
   * IMPORTANT:
   * The role comes from the authenticated session.
   * Never trust FormData for authorization.
   */
  const editorRole =
    session.role as EditorRole;

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

        teacherPatterns: {
          select: {
            patternId: true,
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
     
     A TEACHER can only edit their own account.
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
      (assignment) => assignment.batchId
    );

  const existingPatternIds =
    existingTeacher.teacherPatterns.map(
      (teacherPattern) =>
        teacherPattern.patternId
    );

  /* =======================================================
     PARSE BATCH IDS
     
     We parse these even for TEACHER so that an attacker
     cannot modify the FormData and silently change batches.
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
     
     We parse these even for TEACHER so unauthorized
     modifications can be detected.
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
     
     This happens BEFORE any database mutation.
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
            existingTeacher.user.email
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
          existingBatchIds
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
            patternIds: [
              "You are not allowed to modify patterns.",
            ],
          },
        };
      }
    }
  }

  /* =======================================================
     EFFECTIVE BATCH VALUES
     
     ADMIN:
       submitted batches

     TEACHER:
       existing batches
  ======================================================= */

  const effectiveBatchIds =
    permissions.batches
      ? uniqueBatchIds
      : existingBatchIds;

  /* =======================================================
     EFFECTIVE PATTERN VALUES
     
     ADMIN:
       submitted patterns

     TEACHER:
       existing patterns
  ======================================================= */

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
       * Branches are NOT persisted on Teacher.
       * They are derived from assigned batches.
       */
      branchIds:
        formData.get("branchIds"),

      batchIds:
        effectiveBatchIds,

      patternIds:
        effectivePatternIds,
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
     VERIFY SELECTED BATCHES
     
     Only an actor with batches=true can change them.
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
       VERIFY BRANCH IDS
    ------------------------------------------------------- */

    const submittedBranchIds =
      parseJsonArray(
        formData,
        "branchIds"
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

    const invalidBatch =
      selectedBatches.some(
        (batch) =>
          !uniqueBranchIds.includes(
            batch.branchId
          )
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
     VERIFY SELECTED PATTERNS
     
     Patterns must belong to at least one selected batch.
     
     This prevents an ADMIN from manually submitting an
     unrelated pattern ID.
  ======================================================= */

  if (permissions.patterns) {
    /*
     * If no patterns were selected, that's valid.
     * Otherwise verify all selected patterns exist.
     */
    if (effectivePatternIds.length > 0) {
      const patternCount =
        await prisma.pattern.count({
          where: {
            id: {
              in: effectivePatternIds,
            },
          },
        });

      if (
        patternCount !==
        effectivePatternIds.length
      ) {
        return {
          errors: {
            patternIds: [
              "One or more selected patterns are invalid.",
            ],
          },
        };
      }

      /*
       * Get patterns actually available through the
       * selected batches.
       */
      const availableBatchPatterns =
        await prisma.batchPattern.findMany({
          where: {
            batchId: {
              in: effectiveBatchIds,
            },

            patternId: {
              in: effectivePatternIds,
            },
          },

          select: {
            patternId: true,
          },
        });

      const availablePatternIds = new Set(
        availableBatchPatterns.map(
          (item) => item.patternId
        )
      );

      const invalidPatternIds =
        effectivePatternIds.filter(
          (patternId) =>
            !availablePatternIds.has(
              patternId
            )
        );

      if (invalidPatternIds.length > 0) {
        return {
          errors: {
            patternIds: [
              "One or more selected patterns are not available for the selected batches.",
            ],
          },
        };
      }
    }
  }

  /* =======================================================
     DATABASE TRANSACTION
     
     Everything below is atomic.
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
            "TEACHER_NOT_FOUND"
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
            "UNAUTHORIZED_TEACHER"
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
              id: teacher.userId,
            },

            data: userData,
          });
        }

        /* ---------------------------------------------------
           TEACHER ASSIGNMENTS
           
           Only ADMIN can modify batches.
        --------------------------------------------------- */

        if (permissions.batches) {
          await tx.teacherAssignment.deleteMany({
            where: {
              teacherId: teacher.id,
            },
          });

          if (effectiveBatchIds.length > 0) {
            await tx.teacherAssignment.createMany({
              data: effectiveBatchIds.map(
                (batchId) => ({
                  teacherId: teacher.id,
                  batchId,
                })
              ),
            });
          }
        }

        /* ---------------------------------------------------
           TEACHER PATTERNS
           
           Only ADMIN can modify patterns.
        --------------------------------------------------- */

        if (permissions.patterns) {
          await tx.teacherPattern.deleteMany({
            where: {
              teacherId: teacher.id,
            },
          });

          if (
            effectivePatternIds.length > 0
          ) {
            await tx.teacherPattern.createMany({
              data: effectivePatternIds.map(
                (patternId) => ({
                  teacherId: teacher.id,
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
     SUCCESS
  ======================================================= */

  return {
    success: true,
  };
}
