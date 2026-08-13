"use client";

import UserForm from "@/components/registerComponent";

import { registerTeacher } from "@/app/ServerActions/auth/registeration/registerTeacher";
import { SignupFormSchemaTeacher } from "@/app/ServerActions/auth/Validate";

type Branch = {
  id: string;
  name: string;
  batches: {
    id: string;
    name: string;
  }[];
};

type AdminRegisterTeacherFormProps = {
  branches: Branch[];
};

export default function AdminRegisterTeacherForm({
  branches,
}: AdminRegisterTeacherFormProps) {
  return (
    <UserForm
      mode="create"
      role="TEACHER"
      action={registerTeacher}
      schema={SignupFormSchemaTeacher}
      branches={branches}
    />
  );
}