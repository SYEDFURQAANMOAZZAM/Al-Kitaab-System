
"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { getStudentsForSearchService } from "../services/studentSearchService";
import { getActionError } from "./actionUtils";
import type { ActionResult, StudentSearchItem } from "../types";

const Schema = z.object({
  batchId: z.string().trim().min(1),
  searchTerm: z.string().trim().min(3, "Enter at least 3 characters").max(100),
});

export async function getStudentsForSearch(
  batchId: string,
  searchTerm: string
): Promise<ActionResult<StudentSearchItem[]>> {
  try {
    await requireRole("ADMIN", "TEACHER");

    const parsed = Schema.safeParse({ batchId, searchTerm });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const data = await getStudentsForSearchService(
      parsed.data.batchId,
      parsed.data.searchTerm
    );

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: getActionError(error, "Failed to search students"),
    };
  }
}
