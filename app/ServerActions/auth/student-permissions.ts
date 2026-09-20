export type EditorRole = "ADMIN" | "TEACHER" | "STUDENT";

export type StudentField =
  | "name"
  | "fatherName"
  | "address"
  | "email"
  | "phone"
  | "phone2"
  | "password"
  | "batches"
  | "subjects";

export type FieldPermissions = Record<StudentField, boolean>;

export const STUDENT_FIELD_PERMISSIONS: Record<
  EditorRole,
  FieldPermissions
> = {
  ADMIN: {
    name: true,
    fatherName: true,
    address: true,
    email: true,
    phone: true,
    phone2: true,
    password: true,
    batches: true,
    subjects: true,
  },

  TEACHER: {
    name: true,
    fatherName: true,
    address: true,
    email: true,
    phone: true,
    phone2: true,
    password: true,
    batches: true,
    subjects: true,
  },

  STUDENT: {
    name: true,
    fatherName: false,
    address: false,
    email: false,
    phone: false,
    phone2: true,
    password: true,
    batches: false,
    subjects: false,
  },
};