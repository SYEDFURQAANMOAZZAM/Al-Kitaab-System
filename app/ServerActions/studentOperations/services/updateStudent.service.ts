import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";

import { normalizeEmail } from "@/lib/auth/email";

import {
  STUDENT_FIELD_PERMISSIONS,
  type EditorRole,
} from "../student-permissions";

import {
  FormStateRegister,
  EditSchemaStudent,
} from "../../auth/Validate";

import {
  findStudentForUpdate,
  findSelectedBatches,
  updateStudentRecord,
} from "../queries/updateStudent.queries";

import type {
  UpdateStudentSession,
} from "../types/updateStudent.types";

function parseJsonArray(
  formData: FormData,
  fieldName: string,
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
        (
          value,
        ): value is string =>
          typeof value === "string",
      )
    ) {
      return null;
    }

    return [...new Set(parsed)];
  } catch {
    return null;
  }
}

function normalizeValue(
  value: string | null | undefined,
): string {
  return (value ?? "").trim();
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

export async function updateStudentService(
  userId: string,
  _state: FormStateRegister,
  formData: FormData,
  session: UpdateStudentSession,
): Promise<FormStateRegister> {
  const editorRole =
    session.role as EditorRole;

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
    await findStudentForUpdate(userId);

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
      (enrollment) =>
        enrollment.batchId,
    );

  const existingSubjectIds =
    existingStudent.studentSubjects.map(
      (studentSubject) =>
        studentSubject.subjectId,
    );

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

  if (editorRole === "STUDENT") {
    /* -----------------------------------------------------
       EMAIL
    ----------------------------------------------------- */

    if (!permissions.email) {
      const submittedEmail =
        formData.get("email");

      if (
        typeof submittedEmail !== "string" ||
        normalizeEmail(submittedEmail) !==
          normalizeEmail(
            existingStudent.user.email,
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

    /* -----------------------------------------------------
       PHONE
    ----------------------------------------------------- */

    if (!permissions.phone) {
      const submittedPhone =
        formData.get("phone");

      if (
        typeof submittedPhone !== "string" ||
        normalizeValue(submittedPhone) !==
          normalizeValue(
            existingStudent.user.phone,
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

    /* -----------------------------------------------------
       FATHER NAME
    ----------------------------------------------------- */

    if (!permissions.fatherName) {
      const submittedFatherName =
        formData.get("fatherName");

      if (
        typeof submittedFatherName !==
          "string" ||
        normalizeValue(
          submittedFatherName,
        ) !==
          normalizeValue(
            existingStudent.fatherName,
          )
      ) {
        return {
          errors: {
            fatherName: [
              "You are not allowed to modify the father's name.",
            ],
          },
        };
      }
    }

    /* -----------------------------------------------------
       ADDRESS
    ----------------------------------------------------- */

    if (!permissions.address) {
      const submittedAddress =
        formData.get("address");

      if (
        typeof submittedAddress !==
          "string" ||
        normalizeValue(
          submittedAddress,
        ) !==
          normalizeValue(
            existingStudent.Adress,
          )
      ) {
        return {
          errors: {
            address: [
              "You are not allowed to modify the address.",
            ],
          },
        };
      }
    }

    /* -----------------------------------------------------
       BATCHES
    ----------------------------------------------------- */

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

    /* -----------------------------------------------------
       SUBJECTS
    ----------------------------------------------------- */

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
     DETERMINE EFFECTIVE VALUES
  ======================================================= */

  const effectiveBatchIds =
    permissions.batches
      ? uniqueBatchIds
      : existingBatchIds;

  const effectiveSubjectIds =
    permissions.subjects
      ? uniqueSubjectIds
      : existingSubjectIds;

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

      fatherName: permissions.fatherName
        ? formData.get("fatherName")
        : existingStudent.fatherName,

      address: permissions.address
        ? formData.get("address")
        : existingStudent.Adress,

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

  const data =
    validatedFields.data;

  /* =======================================================
     VERIFY SELECTED BATCHES
  ======================================================= */

  let selectedBatches: {
    id: string;
    subjects: {
      subjectId: string;
    }[];
  }[] = [];

  if (permissions.batches) {
    selectedBatches =
      await findSelectedBatches(
        effectiveBatchIds,
      );

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
     VERIFY SUBJECTS
  ======================================================= */

  if (permissions.subjects) {
    if (!permissions.batches) {
      selectedBatches =
        await findSelectedBatches(
          existingBatchIds,
        );
    }

    const availableSubjectIds =
      new Set<string>();

    for (
      const batch of selectedBatches
    ) {
      for (
        const batchSubject of
          batch.subjects
      ) {
        availableSubjectIds.add(
          batchSubject.subjectId,
        );
      }
    }

    const invalidSubjectIds =
      effectiveSubjectIds.filter(
        (subjectId) =>
          !availableSubjectIds.has(
            subjectId,
          ),
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
  }

  /* =======================================================
     BUILD USER UPDATE DATA
  ======================================================= */

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

  if (permissions.phone2) {
    userData.phone2 =
      data.phone2 || null;
  }

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

  /* =======================================================
     BUILD STUDENT UPDATE DATA
  ======================================================= */

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

  /* =======================================================
     DATABASE TRANSACTION
  ======================================================= */

  try {
    await updateStudentRecord(
      existingStudent.id,
      effectiveBatchIds,
      effectiveSubjectIds,
      userData,
      studentData,
      permissions.batches,
      permissions.subjects,
      editorRole,
      session.id,
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
         EMAIL UNIQUE CONSTRAINT ONLY
      --------------------------------------------------- */

      if (error.code === "P2002") {
        const target =
          Array.isArray(
            error.meta?.target,
          )
            ? error.meta.target.join(
                ", ",
              )
            : String(
                error.meta?.target ??
                  "",
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
      error,
    );

    return {
      message:
        "Unable to update the student. Please try again.",
    };
  }

  /* =======================================================
     SUCCESS
  ======================================================= */

  return {
    success: true,
  };
}