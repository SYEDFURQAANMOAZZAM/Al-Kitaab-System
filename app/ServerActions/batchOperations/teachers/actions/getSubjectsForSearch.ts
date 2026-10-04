
"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { getSubjectsForSearchService } from "../services/teacherSearchService";
import type { ActionResult, SubjectSearchItem } from "../types";

const Schema = z.object({
  teacherId: z.string().min(1),
  search: z.string().trim().min(2).max(100),
});

export async function getSubjectsForSearch(
  teacherId: string,
  search: string,
): Promise<ActionResult<SubjectSearchItem[]>> {
  try {
    await requireRole("ADMIN", "TEACHER");

    const parsed = Schema.safeParse({ teacherId, search });
    if (!parsed.success) {
      return { success: false, error: "Enter at least 2 search characters." };
    }

    const data = await getSubjectsForSearchService(
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
