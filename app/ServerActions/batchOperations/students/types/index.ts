
export type ActionResult<T = undefined> =
  | {
      success: true;
      message?: string;
      data?: T;
    }
  | {
      success: false;
      error: string;
    };

export type StudentSubjectItem = {
  id: string;
  name: string;
};

export type BatchStudentItem = {
  enrollmentId: string;
  studentId: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  subjects: StudentSubjectItem[];
};

export type StudentSearchItem = {
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

export type StudentSearchInput = {
  batchId: string;
  searchTerm: string;
};

export type SubjectSearchInput = {
  studentId: string;
  searchTerm: string;
};

export type AddStudentToBatchInput = {
  studentId: string;
  batchId: string;
};

export type RemoveStudentFromBatchInput = {
  studentId: string;
  batchId: string;
};

export type ReplaceStudentBatchInput = {
  studentId: string;
  currentBatchId: string;
  newBatchId: string;
};

export type StudentSubjectInput = {
  studentId: string;
  subjectId: string;
};
