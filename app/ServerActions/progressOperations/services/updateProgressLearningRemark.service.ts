import { updateTodayProgressLearningRemark } from "../queries/updateProgressLearningRemark.queries";
import type { UpdateProgressLearningRemarkInput } from "../types/progressRelated.types";

export async function updateProgressLearningRemarkService(
  data: UpdateProgressLearningRemarkInput,
) {
  const indiaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const today = new Date(`${indiaDate}T00:00:00.000Z`);
  const remark = data.remark.trim() || undefined;

  const result = await updateTodayProgressLearningRemark(
    data.studentId,
    data.batchId,
    today,
    data.learningId,
    remark,
  );

  return {
    success: true,
    progressId: result.progressId,
  };
}
