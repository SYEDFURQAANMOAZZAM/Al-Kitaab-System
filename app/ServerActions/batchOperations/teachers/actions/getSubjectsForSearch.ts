
"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { getSubjectsForSearchService } from "../services/teacherSearchService";
import type { ActionResult, SubjectSearchItem } from "../types";

const Schema = z.object({
  batchId: z.string().min(1),
  teacherId: z.string().min(1),
  search: z.string().trim().max(100),
});

export async function getSubjectsForSearch(
  batchId: string,
  teacherId: string,
  search: string,
): Promise<ActionResult<{ subjects: SubjectSearchItem[]; batchSubjectCount: number }>> {
  try {
    await requireRole("ADMIN", "TEACHER");

    const parsed = Schema.safeParse({ batchId, teacherId, search });
    if (!parsed.success) {
      return { success: false, error: "Invalid batch, teacher, or search term." };
    }

    const data = await getSubjectsForSearchService(
      parsed.data.batchId,
      parsed.data.teacherId,
      parsed.data.search,
    );

    return { success: true, data };
  } catch (error) {
    console.error("getSubjectsForSearch:", error);
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "Failed to search subjects.",
    };
  }
}
