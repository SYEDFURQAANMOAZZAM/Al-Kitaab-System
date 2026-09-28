import {
  findBatchSubjectIds,
  findStudentSubjects,
  findTeacherSubjectIds,
} from "../queries/commonSubjects.queries";

export async function getCommonSubjectsService({
  studentId,
  batchId,
  teacherUserId,
}: {
  studentId: string;
  batchId: string;
  teacherUserId?: string;
}) {
  const [studentSubjects, batchSubjects] =
    await Promise.all([
      findStudentSubjects(studentId),
      findBatchSubjectIds(batchId),
    ]);

  const batchSubjectIds = new Set(
    batchSubjects.map((item) => item.subjectId),
  );

  // ADMIN
  // Student Subjects ∩ Batch Subjects
  if (!teacherUserId) {
    return studentSubjects
      .filter((item) =>
        batchSubjectIds.has(item.subject.id),
      )
      .map((item) => item.subject);
  }

  // TEACHER
  const teacherSubjects =
    await findTeacherSubjectIds(teacherUserId);

  const teacherSubjectIds = new Set(
    teacherSubjects.map((item) => item.subjectId),
  );

  // Student Subjects ∩ Batch Subjects ∩ Teacher Subjects
  return studentSubjects
    .filter((item) => {
      const subjectId = item.subject.id;

      return (
        batchSubjectIds.has(subjectId) &&
        teacherSubjectIds.has(subjectId)
      );
    })
    .map((item) => item.subject);
}