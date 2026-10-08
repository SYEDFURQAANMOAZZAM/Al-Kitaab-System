
import { getBranchesWithBatchesQuery } from "../queries/getBranchesWithBatchesQuery";
import { getSubjectsForSearchQuery } from "../queries/getSubjectsForSearchQuery";

export async function getBranchesWithBatchesService() {
  return getBranchesWithBatchesQuery();
}

export async function getSubjectsForSearchService(
  batchId: string,
  teacherId: string,
  search: string,
) {
  return getSubjectsForSearchQuery(batchId, teacherId, search);
}
