export type GroupActionState =
  | {
      error?: string;
      success?: string;
    }
  | undefined;

export type BatchSubjectOption = {
  id: string;
  name: string;
};

export type BatchFormData = {
  id: string;
  name: string;
  branchId: string;
  subjects: {
    id: string;
    name: string;
  }[];
};