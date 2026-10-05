import { addSubjectPartQuery } from "../queries/addSubjectPart.queries";

export async function addSubjectPartService(
  subjectId: string,
  name: string,
) {
  return addSubjectPartQuery(subjectId, name);
}