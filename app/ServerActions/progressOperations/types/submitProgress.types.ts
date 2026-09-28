export type ProgressLearning = {
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

type StoredTocValue =
  | {
      id: string;
      name: string;
    }
  | {
      from: {
        id: string;
        name: string;
      };
      to?: {
        id: string;
        name: string;
      };
    };

export type StoredProgressLearning = {
  learningId: string;

  subject: {
    id: string;
    name: string;
  } | null;

  status: string;

  parts: {
    subjectPart: {
      id: string;
      name: string;
    };

    value: StoredTocValue | "";
  }[];
};

export type SubmitProgressInput = {
  studentId: string;
  batchId: string;
  batchName: string;
  learnings: ProgressLearning[];
};