'use server'

import { prisma } from "@/lib/prisma"
import { FormStateRegister, SignupFormSchema } from "./Validate"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs";
import { Role } from '@/generated/prisma/enums'
import { Prisma } from "@/generated/prisma/client";

 
export async function register(state: FormStateRegister, formData: FormData) {
  // Validate form fields
  const validatedFields = SignupFormSchema.safeParse({
  name: formData.get("name"),
  email: formData.get("email"),
  password: formData.get("password"),
  confirmPassword: formData.get("confirmPassword"),
  role: formData.get("role"),
  isaccess: formData.get("isaccess"),
  batch: formData.get("batch"),
  branch: formData.get("branch"),
});
 
  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }
  else{

  const hashedPassword = await bcrypt.hash(
  validatedFields.data.password,
  10
);
const existingUser = await prisma.user.findUnique({
  where: {
    email: validatedFields.data.email,
  },
});

if (existingUser) {
  return {
    message: "Email already exists",
  };
}
    const data : Prisma.UserCreateInput = {
      name: validatedFields.data.name,
      email: validatedFields.data.email,
      password: hashedPassword,
      role: validatedFields.data.role,
      isaccess: validatedFields.data.isaccess,
    };
    
   const batchId = await prisma.batch.findFirst({
     where: {
       batchname: validatedFields.data.batch,
       },
     });

     if (!batchId) {
       return {
         message: "Batch not found",
       };
     }

     const branchId = await prisma.branch.findFirst({
     where: {
       branchname: validatedFields.data.branch,
       },
     });

     if (!branchId) {
       return {
         message: "Branch not found",
       };
     }

    if (validatedFields.data.role === Role.TEACHER) {
      data.teacher = {
        create: {
          batchId: batchId.id,
          branchId: branchId.id,
        },
      };
    } else if (validatedFields.data.role === Role.STUDENT) {
      data.student = {
        create: {
          batchId: batchId.id,
          branchId: branchId.id,
        },
      };
    }

    await prisma.user.create({ data });
    
    

    console.log(data)
    redirect("/login");
  }
  
  
}