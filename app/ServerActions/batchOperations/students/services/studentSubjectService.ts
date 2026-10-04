
import {
  addSubjectToStudentQuery,
  deleteSubjectFromStudentQuery,
} from "../queries/studentSubjectMutationsQuery";

export async function addSubjectToStudentService(
  studentId: string,
  subjectId: string
) {
  const added = await addSubjectToStudentQuery(
    studentId,
    subjectId
  );

  if (!added) {
    throw new Error("Subject is already assigned to this student");
  }
}

export async function deleteSubjectFromStudentService(
  studentId: string,
  subjectId: string
) {
  const deleted = await deleteSubjectFromStudentQuery(
    studentId,
    subjectId
  );

  if (!deleted) {
    throw new Error("Student subject assignment not found");
  }
}
