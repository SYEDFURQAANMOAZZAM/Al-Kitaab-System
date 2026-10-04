
export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export type TeacherSubjectItem = {
  id: string;
  name: string;
};

export type BatchTeacherItem = {
  assignmentId: string;
  teacherId: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  subjects: TeacherSubjectItem[];
};

export type TeacherSearchItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
};

export type BranchWithBatches = {
  id: string;
  name: string;
  batches: {
    id: string;
    name: string;
  }[];
};

export type SubjectSearchItem = {
  id: string;
  name: string;
};

export type AddTeacherToBatchInput = {
  teacherId: string;
  batchId: string;
};

export type RemoveTeacherFromBatchInput = {
  teacherId: string;
  batchId: string;
};

export type ReplaceTeacherBatchAssignmentInput = {
  teacherId: string;
  currentBatchId: string;
  newBatchId: string;
};

export type TeacherSubjectInput = {
  teacherId: string;
  subjectId: string;
};
