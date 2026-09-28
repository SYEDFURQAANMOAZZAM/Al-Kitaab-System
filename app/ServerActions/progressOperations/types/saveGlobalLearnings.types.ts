export type SubjectPart = {
  id: string;
  name: string;
  position: number;
};

export type GlobalLearning = {
  id: string;

  subject: {
    id: string;
    name: string;
    parts: SubjectPart[];
  } | null;

  status: string;

  values: Record<
    string,
    string | {
      from: string;
      to?: string;
    }
  >;
};

export type ProgressLearningForStorage = {
  learningId: string;

  subject: {
    id: string;
    name: string;
  } | null;

  status: string;

  parts: {
    subjectPart: string;

    value:
      | string
      | {
          from: string;
          to?: string;
        };
  }[];
};

export type TocTrackingLearning = {
  learningId: string;

  subject: {
    id: string;
    name: string;
  } | null;

  status: string;

  parts: {
    id: string;
    name: string;
    position: number;

    value:
      | string
      | {
          from: string;
          to?: string;
        };
  }[];
};

export type SaveGlobalLearningsInput = {
  batchId: string;
  batchName: string;
  studentIds: string[];
  learnings: GlobalLearning[];
};