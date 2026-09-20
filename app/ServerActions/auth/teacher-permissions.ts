export type EditorRole =
  | "ADMIN"
  | "TEACHER";

export type TeacherField =
  | "name"
  | "email"
  | "phone"
  | "password"
  | "batches"
  | "subjects";

export type TeacherFieldPermissions =
  Record<TeacherField, boolean>;

export const TEACHER_FIELD_PERMISSIONS:
  Record<
    EditorRole,
    TeacherFieldPermissions
  > = {
    ADMIN: {
      name: true,
      email: true,
      phone: true,
      password: true,
      batches: true,
      subjects: true,
    },

    TEACHER: {
      name: true,
      email: false,
      phone: true,
      password: true,
      batches: false,
      subjects: false,
    },
  };