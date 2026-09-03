"use client";

import UserForm, {
  type Branch,
} from "./registerComponentStudent";

import { createStudent } from "@/app/ServerActions/auth/registeration/registerStudent";

type AdminRegisterStudentFormProps = {
  branches: Branch[];
};

export default function AdminRegisterStudentForm({
  branches,
}: AdminRegisterStudentFormProps) {
  return (
    <UserForm
      mode="create"
      role="STUDENT"
      action={createStudent}
      branches={branches}
    />
  );
}