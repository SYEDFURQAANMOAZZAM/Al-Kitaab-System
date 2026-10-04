
import { getBranchesWithBatchesQuery } from "../queries/getBranchesWithBatchesQuery";
import { getSubjectsForSearchQuery } from "../queries/getSubjectsForSearchQuery";

export async function getBranchesWithBatchesService() {
  return getBranchesWithBatchesQuery();
}

export async function getSubjectsForSearchService(
  teacherId: string,
  search: string,
) {
  return getSubjectsForSearchQuery(teacherId, search);
}
