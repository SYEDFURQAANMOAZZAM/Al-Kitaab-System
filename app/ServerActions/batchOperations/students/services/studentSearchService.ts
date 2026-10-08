
import {
  getStudentsForSearchQuery,
} from "../queries/getStudentsForSearchQuery";

import {
  getSubjectsForSearchQuery,
} from "../queries/getSubjectsForSearchQuery";

export async function getStudentsForSearchService(
  batchId: string,
  searchTerm: string
) {
  return getStudentsForSearchQuery(batchId, searchTerm);
}

export async function getSubjectsForSearchService(
  batchId: string,
  studentId: string,
  searchTerm: string
) {
  return getSubjectsForSearchQuery(batchId, studentId, searchTerm);
}
