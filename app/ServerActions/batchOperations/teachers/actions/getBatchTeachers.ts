
"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { getBatchTeachersService } from "../services/teacherBatchService";
import type { ActionResult, BatchTeacherItem } from "../types";

const Schema = z.string().min(1, "Batch ID is required.");

export async function getBatchTeachers(
  batchId: string,
): Promise<ActionResult<BatchTeacherItem[]>> {
  try {
    await requireRole("ADMIN", "TEACHER");

    const parsed = Schema.safeParse(batchId);
    if (!parsed.success) {
      return { success: false, error: "Invalid batch ID." };
    }

    const data = await getBatchTeachersService(parsed.data);
    return { success: true, data };
  } catch (error) {
    console.error("getBatchTeachers:", error);
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "Failed to fetch batch teachers.",
    };
  }
}
