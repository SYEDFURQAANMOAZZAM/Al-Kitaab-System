
import { replaceSubjectBatchesQuery } from "../queries/subjectBatch.queries";

export async function replaceSubjectBatchesService(
  subjectId: string,
  batchIds: string[],
) {
  const uniqueBatchIds = [...new Set(batchIds)];

  return replaceSubjectBatchesQuery(
    subjectId,
    uniqueBatchIds,
  );
}
