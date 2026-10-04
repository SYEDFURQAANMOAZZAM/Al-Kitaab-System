
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
  studentId: string,
  searchTerm: string
) {
  return getSubjectsForSearchQuery(studentId, searchTerm);
}
