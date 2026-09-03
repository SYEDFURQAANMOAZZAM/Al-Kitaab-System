"use client";

import UserForm from "./registerTeacherComponent";

import { registerTeacher } from "@/app/ServerActions/auth/registeration/registerTeacher";

type Branch = {
  id: string;
  name: string;

  batches: {
    id: string;
    name: string;
    branchId: string;
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
      branches={branches}
    />
  );
}