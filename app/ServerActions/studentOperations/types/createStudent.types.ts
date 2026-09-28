import type { FormStateRegister } from "../../auth/Validate";

export type CreateStudentRecordInput = {
  name: string;
  email: string;
  phone: string | null;
  phone2: string | null;
  passwordHash: string;
  fatherName: string;
  address: string;
  batchIds: string[];
  subjectIds: string[];
};

export type CreateStudentResult =
  FormStateRegister;