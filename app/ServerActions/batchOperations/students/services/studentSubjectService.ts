
import {
  addSubjectToStudentQuery,
  deleteSubjectFromStudentQuery,
} from "../queries/studentSubjectMutationsQuery";

export async function addSubjectToStudentService(
  studentId: string,
  batchId: string,
  subjectId: string
) {
  const added = await addSubjectToStudentQuery(
    studentId,
    batchId,
    subjectId
  );

  if (!added) {
    throw new Error("Subject is already assigned to this student");
  }
}

export async function deleteSubjectFromStudentService(
  studentId: string,
  batchId: string,
  subjectId: string
) {
  const deleted = await deleteSubjectFromStudentQuery(
    studentId,
    batchId,
    subjectId
  );

  if (!deleted) {
    throw new Error("Student subject assignment not found");
  }
}
