"use server";

import { saveTocCompletionService } from "../services/saveTocCompletion.service";
import type { TocLearning } from "../types/saveTocCompletion.types";

export async function saveTocCompletion(
  studentSubjectId: string,
  learnings: TocLearning[],
) {
  return saveTocCompletionService(
    studentSubjectId,
    learnings,
  );
}