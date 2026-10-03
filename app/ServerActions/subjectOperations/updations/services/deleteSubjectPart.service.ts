
import { deleteSubjectPartQuery } from "../queries/deleteSubjectPart.queries";

export async function deleteSubjectPartService(
  subjectPartId: string,
) {
  return deleteSubjectPartQuery(subjectPartId);
}
