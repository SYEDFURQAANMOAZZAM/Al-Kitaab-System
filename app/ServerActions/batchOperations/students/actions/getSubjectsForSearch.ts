
"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { getSubjectsForSearchService } from "../services/studentSearchService";
import { getActionError } from "./actionUtils";
import type { ActionResult, SubjectSearchItem } from "../types";

const Schema = z.object({
  batchId: z.string().trim().min(1),
  studentId: z.string().trim().min(1),
  searchTerm: z.string().trim().max(100),
});

export async function getSubjectsForSearch(
  batchId: string,
  studentId: string,
  searchTerm: string
): Promise<ActionResult<{ subjects: SubjectSearchItem[]; batchSubjectCount: number }>> {
  try {
    await requireRole("ADMIN", "TEACHER");

    const parsed = Schema.safeParse({ batchId, studentId, searchTerm });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const data = await getSubjectsForSearchService(
      parsed.data.batchId,
      parsed.data.studentId,
      parsed.data.searchTerm
    );

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: getActionError(error, "Failed to search subjects"),
    };
  }
}
