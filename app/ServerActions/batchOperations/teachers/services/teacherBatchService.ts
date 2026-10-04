
import {
  addTeacherToBatchQuery,
  removeTeacherFromBatchQuery,
  replaceTeacherBatchAssignmentQuery,
} from "../queries/teacherBatchMutationsQuery";
import { getBatchTeachersQuery } from "../queries/getBatchTeachersQuery";
import { getTeachersForSearchQuery } from "../queries/getTeachersForSearchQuery";

export async function getBatchTeachersService(batchId: string) {
  return getBatchTeachersQuery(batchId);
}

export async function getTeachersForSearchService(
  batchId: string,
  search: string,
) {
  return getTeachersForSearchQuery(batchId, search);
}

export async function addTeacherToBatchService(
  teacherId: string,
  batchId: string,
) {
  const result = await addTeacherToBatchQuery(teacherId, batchId);

  if (result.count === 0) {
    throw new Error("Teacher is already assigned to this batch.");
  }

  return { teacherId, batchId };
}

export async function removeTeacherFromBatchService(
  teacherId: string,
  batchId: string,
) {
  const result = await removeTeacherFromBatchQuery(
    teacherId,
    batchId,
  );

  if (result.count === 0) {
    throw new Error("Teacher assignment not found.");
  }

  return { teacherId, batchId };
}

export async function replaceTeacherBatchAssignmentService(
  teacherId: string,
  currentBatchId: string,
  newBatchId: string,
) {
  return replaceTeacherBatchAssignmentQuery(
    teacherId,
    currentBatchId,
    newBatchId,
  );
}
