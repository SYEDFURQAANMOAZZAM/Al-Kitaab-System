
import {
  getBatchStudentsQuery,
} from "../queries/getBatchStudentsQuery";

import {
  getBranchesWithBatchesQuery,
} from "../queries/getBranchesWithBatchesQuery";

import {
  addStudentToBatchQuery,
  removeStudentFromBatchQuery,
  replaceStudentBatchEnrollmentQuery,
} from "../queries/studentBatchMutationsQuery";

export async function getBatchStudentsService(batchId: string) {
  return getBatchStudentsQuery(batchId);
}

export async function addStudentToBatchService(
  studentId: string,
  batchId: string
) {
  const added = await addStudentToBatchQuery(studentId, batchId);

  if (!added) {
    throw new Error("Student is already enrolled in this batch");
  }
}

export async function removeStudentFromBatchService(
  studentId: string,
  batchId: string
) {
  const removed = await removeStudentFromBatchQuery(
    studentId,
    batchId
  );

  if (!removed) {
    throw new Error("Student enrollment not found");
  }
}

export async function getBranchesWithBatchesService() {
  return getBranchesWithBatchesQuery();
}

export async function replaceStudentBatchEnrollmentService(
  studentId: string,
  currentBatchId: string,
  newBatchId: string
) {
  return replaceStudentBatchEnrollmentQuery(
    studentId,
    currentBatchId,
    newBatchId
  );
}
