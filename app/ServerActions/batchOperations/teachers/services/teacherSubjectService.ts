
import {
  addSubjectToTeacherQuery,
  deleteSubjectFromTeacherQuery,
} from "../queries/teacherSubjectMutationsQuery";

export async function addSubjectToTeacherService(
  teacherId: string,
  subjectId: string,
) {
  const result = await addSubjectToTeacherQuery(
    teacherId,
    subjectId,
  );

  if (result.count === 0) {
    throw new Error("Teacher is already assigned to this subject.");
  }

  return { teacherId, subjectId };
}

export async function deleteSubjectFromTeacherService(
  teacherId: string,
  subjectId: string,
) {
  const result = await deleteSubjectFromTeacherQuery(
    teacherId,
    subjectId,
  );

  if (result.count === 0) {
    throw new Error("Teacher subject assignment not found.");
  }

  return { teacherId, subjectId };
}
