
"use server";

import { z } from "zod";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { replaceSubjectTrackingTermsService } from "./updations/services/subjectTrackingTerms.service";
import { updateSubjectNameService } from "./updations/services/subjectName.service";
import { updateSubjectPartNameService } from "./updations/services/subjectPartName.service";
import { deleteSubjectPartService } from "./updations/services/deleteSubjectPart.service";
import { replaceSubjectBatchesService } from "./updations/services/subjectBatch.service";

const SubjectNameSchema = z.object({
  subjectId: z.string().min(1, "Subject ID is required"),
  name: z.string().trim().min(1, "Subject name is required"),
});

const SubjectPartNameSchema = z.object({
  subjectPartId: z.string().min(1, "Subject part ID is required"),
  name: z.string().trim().min(1, "Subject part name is required"),
});

const DeleteSubjectPartSchema = z.object({
  subjectPartId: z.string().min(1, "Subject part ID is required"),
});

const SubjectBatchSchema = z.object({
  subjectId: z.string().min(1, "Subject ID is required"),
  batchIds: z.array(z.string().min(1, "Invalid batch ID")),
});

function getValidationError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid data";
}

// 1. Change subject name
export async function updateSubjectName(input: unknown) {
  await requireRoleForAction(["ADMIN", "TEACHER"]);

  const parsed = SubjectNameSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: getValidationError(parsed.error),
    };
  }

  try {
    const subject = await updateSubjectNameService(
      parsed.data.subjectId,
      parsed.data.name,
    );

    return {
      success: true,
      subject,
    };
  } catch (error) {
    console.error("updateSubjectName error:", error);

    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "Failed to update subject name",
    };
  }
}

// 2. Change subject part name
export async function updateSubjectPartName(input: unknown) {
  await requireRoleForAction(["ADMIN", "TEACHER"]);

  const parsed = SubjectPartNameSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: getValidationError(parsed.error),
    };
  }

  try {
    const subjectPart = await updateSubjectPartNameService(
      parsed.data.subjectPartId,
      parsed.data.name,
    );

    return {
      success: true,
      subjectPart,
    };
  } catch (error) {
    console.error("updateSubjectPartName error:", error);

    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "Failed to update subject part name",
    };
  }
}

// 3. Delete subject part
export async function deleteSubjectPart(input: unknown) {
  await requireRoleForAction(["ADMIN", "TEACHER"]);

  const parsed = DeleteSubjectPartSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: getValidationError(parsed.error),
    };
  }

  try {
    const subjectPart = await deleteSubjectPartService(
      parsed.data.subjectPartId,
    );

    return {
      success: true,
      subjectPart,
    };
  } catch (error) {
    console.error("deleteSubjectPart error:", error);

    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "Failed to delete subject part",
    };
  }
}

// 4. Replace subject's batch associations
export async function updateSubjectBatches(input: unknown) {
  await requireRoleForAction(["ADMIN", "TEACHER"]);

  const parsed = SubjectBatchSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: getValidationError(parsed.error),
    };
  }

  try {
    const batches = await replaceSubjectBatchesService(
      parsed.data.subjectId,
      parsed.data.batchIds,
    );

    return {
      success: true,
      batches,
    };
  } catch (error) {
    console.error("updateSubjectBatches error:", error);

    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "Failed to update subject batches",
    };
  }
}


const UpdateSubjectTrackingTermsSchema = z.object({
  subjectId: z.string().min(1, "Subject ID is required"),
  trackingTerms: z.array(
    z.object({
      name: z.string().trim().min(1, "Tracking term name is required"),
      position: z.number().int().nonnegative(),
    }),
  ),
});

export async function updateSubjectTrackingTerms(input: unknown) {
  await requireRoleForAction(["ADMIN", "TEACHER"]);

  const parsed = UpdateSubjectTrackingTermsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid data",
    };
  }

  try {
    const trackingTerms = await replaceSubjectTrackingTermsService(
      parsed.data.subjectId,
      parsed.data.trackingTerms,
    );

    return {
      success: true,
      trackingTerms,
    };
  } catch (error) {
    console.error("updateSubjectTrackingTerms error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update tracking terms",
    };
  }
}
