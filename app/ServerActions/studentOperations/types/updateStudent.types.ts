import type { Prisma } from "@/generated/prisma/client";

import type { FormStateRegister } from "../../auth/Validate";

export type UpdateStudentSession = {
  id: string;
  role: string;
};

export type UpdateStudentPermissions = {
  name: boolean;
  email: boolean;
  phone: boolean;
  phone2: boolean;
  password: boolean;
  fatherName: boolean;
  address: boolean;
  batches: boolean;
  subjects: boolean;
};

export type ExistingStudent = {
  id: string;
  userId: string;
  fatherName: string | null;
  Adress: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    phone2: string | null;
    role: string;
  };
  enrollments: {
    batchId: string;
  }[];
  studentSubjects: {
    subjectId: string;
  }[];
};

export type SelectedBatch = {
  id: string;
  subjects: {
    subjectId: string;
  }[];
};

export type UpdateStudentData = {
  name: string;
  email: string;
  phone: string | null;
  phone2: string | null;
  password: string;
  confirmPassword: string;
  fatherName: string;
  address: string;
  batchIds: string[];
  subjectIds: string[];
};

export type StudentUserUpdateData = Prisma.UserUpdateInput;

export type StudentUpdateData = Prisma.StudentUpdateInput;

export type UpdateStudentResult = FormStateRegister;