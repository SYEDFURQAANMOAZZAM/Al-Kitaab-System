import {
  findStudentUserId,
  deleteStudentUser,
} from "../queries/deleteStudent.queries";

import type {
  DeleteStudentResult,
} from "../types/deleteStudent.types";

export async function deleteStudentService(
  studentId: string,
): Promise<DeleteStudentResult> {
  if (!studentId) {
    return {
      success: false,
      error: "Student ID is required.",
    };
  }

  const student =
    await findStudentUserId(studentId);

  if (!student) {
    return {
      success: false,
      error: "Student not found.",
    };
  }

  await deleteStudentUser(student.userId);

  return {
    success: true,
  };
}