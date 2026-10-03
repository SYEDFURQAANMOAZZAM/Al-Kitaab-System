
import { updateSubjectNameQuery } from "../queries/subjectName.queries";

export async function updateSubjectNameService(
  subjectId: string,
  name: string,
) {
  return updateSubjectNameQuery(subjectId, name);
}
