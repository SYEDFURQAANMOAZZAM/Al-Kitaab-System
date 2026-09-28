import {
  findStudentByUserId,
} from "../queries/tocReport.queries";

import { buildTocReport } from "./buildTocReport";

export async function getStudentTocReportService({
  userId,
  month,
}: {
  userId: string;
  month?: string;
}) {
  const student =
    await findStudentByUserId(userId);

  if (!student) {
    throw new Error(
      "Student profile not found"
    );
  }

  return buildTocReport({
    studentIds: [student.id],
    month: month?.trim() || undefined,
  });
}