"use client";

import UserForm from "@/components/registerComponent";

import { registerStudent } from "@/app/ServerActions/auth/registeration/registerStudent";
import { SignupFormSchemaStudent } from "@/app/ServerActions/auth/Validate";

type Branch = {
  id: string;
  name: string;
  batches: {
    id: string;
    name: string;
  }[];
};

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
      action={registerStudent}

      branches={branches}
    />
  );
}