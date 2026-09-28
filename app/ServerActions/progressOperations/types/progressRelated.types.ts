export type GetBatchSubjectsInput = {
  batchId: string;
};

export type GetCommonSubjectsInput = {
  studentId: string;
  batchId: string;
};

export type StoredTocItemValue = {
  id: string;
  name: string;
};

export type StoredTocRange = {
  from: StoredTocItemValue;
  to?: StoredTocItemValue;
};

export type StoredLearningPart = {
  subjectPart:
    | string
    | {
        id: string;
        name: string;
      };

  value:
    | string
    | StoredTocItemValue
    | {
        from: string | StoredTocItemValue;
        to?: string | StoredTocItemValue;
      };
};

export type StoredLearning = {
  learningId: string;

  subject?: {
    id?: string;
    name?: string;
    [key: string]: unknown;
  } | null;

  status?: string;

  parts?: StoredLearningPart[];
};

export type TocItem = {
  id: string;
  name: string;
  parentId: string | null;
  subjectPartId: string;
  position: number;
};

export type SubjectPart = {
  id: string;
  name: string;
  position: number;
};

export type TrackingTerm = {
  id: string;
  name: string;
  position: number;
};

export type GetTodayProgressInput = string;

