import { findBatchSubjects } from "../queries/batchSubjects.queries";

export async function getBatchSubjectsService({
  batchId,
  teacherUserId,
}: {
  batchId: string;
  teacherUserId?: string;
}) {
  const results = await findBatchSubjects(
    batchId,
    teacherUserId,
  );

  return results.map((item) => item.subject);
}