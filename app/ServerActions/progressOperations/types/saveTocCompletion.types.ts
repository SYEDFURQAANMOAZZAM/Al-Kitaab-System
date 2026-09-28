export type TocLearningPart = {
  id: string;
  name: string;
  position: number;
  value:
    | string
    | {
        from: string;
        to?: string;
      };
};

export type TocLearning = {
  learningId: string;
  subject: {
    id: string;
    name: string;
  } | null;
  status: string;
  parts: TocLearningPart[];
};

export type TocItem = {
  id: string;
  parentId: string | null;
  position: number;
  subjectPartId: string;
};