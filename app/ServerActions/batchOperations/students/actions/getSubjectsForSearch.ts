
"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { getSubjectsForSearchService } from "../services/studentSearchService";
import { getActionError } from "./actionUtils";
import type { ActionResult, SubjectSearchItem } from "../types";

const Schema = z.object({
  studentId: z.string().trim().min(1),
  searchTerm: z.string().trim().min(3, "Enter at least 3 characters").max(100),
});

export async function getSubjectsForSearch(
  studentId: string,
  searchTerm: string
): Promise<ActionResult<SubjectSearchItem[]>> {
  try {
    await requireRole("ADMIN", "TEACHER");

    const parsed = Schema.safeParse({ studentId, searchTerm });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const data = await getSubjectsForSearchService(
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
