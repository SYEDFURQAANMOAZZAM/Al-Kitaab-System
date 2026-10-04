
"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { getTeachersForSearchService } from "../services/teacherBatchService";
import type { ActionResult, TeacherSearchItem } from "../types";

const Schema = z.object({
  batchId: z.string().min(1),
  search: z.string().trim().min(2).max(100),
});

export async function getTeachersForSearch(
  batchId: string,
  search: string,
): Promise<ActionResult<TeacherSearchItem[]>> {
  try {
    await requireRole("ADMIN", "TEACHER");

    const parsed = Schema.safeParse({ batchId, search });
    if (!parsed.success) {
      return { success: false, error: "Enter at least 2 search characters." };
    }

    const data = await getTeachersForSearchService(
      parsed.data.batchId,
      parsed.data.search,
    );

    return { success: true, data };
  } catch (error) {
    console.error("getTeachersForSearch:", error);
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "Failed to search teachers.",
    };
  }
}
