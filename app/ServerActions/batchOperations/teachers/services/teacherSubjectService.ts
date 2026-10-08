
import {
  addSubjectToTeacherQuery,
  deleteSubjectFromTeacherQuery,
} from "../queries/teacherSubjectMutationsQuery";

export async function addSubjectToTeacherService(
  teacherId: string,
  batchId: string,
  subjectId: string,
) {
  await addSubjectToTeacherQuery(
    teacherId,
    batchId,
    subjectId,
  );

  return { teacherId, subjectId };
}

export async function deleteSubjectFromTeacherService(
  teacherId: string,
  batchId: string,
  subjectId: string,
) {
  const result = await deleteSubjectFromTeacherQuery(
    teacherId,
    batchId,
    subjectId,
  );

  if (result.count === 0) {
    throw new Error("Teacher subject assignment not found.");
  }

  return { teacherId, subjectId };
}
