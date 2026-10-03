
import { updateSubjectPartNameQuery } from "../queries/subjectPartName.queries";

export async function updateSubjectPartNameService(
  subjectPartId: string,
  name: string,
) {
  return updateSubjectPartNameQuery(subjectPartId, name);
}
