"use server";

import { saveGlobalTocCompletionService } from "../services/saveGlobalTocCompletion.service";
import type { TocLearning } from "../types/saveTocCompletion.types";

export async function saveGlobalTocCompletion(
  studentSubjectId: string,
  learnings: TocLearning[],
) {
  return saveGlobalTocCompletionService(
    studentSubjectId,
    learnings,
  );
}