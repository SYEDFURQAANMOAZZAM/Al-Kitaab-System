'use server'

import { prisma } from "@/lib/prisma"
import { FormStateRegister, SignupFormSchema } from "./Validate"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs";

 
export async function register(state: FormStateRegister, formData: FormData) {
  // Validate form fields
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role:formData.get('role'),
    isaccess:formData.get('isaccess')
  })
 
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
    const user=await prisma.user.create({
      data: {
        name: validatedFields.data.name,
        email: validatedFields.data.email,
        password: hashedPassword,
        role:validatedFields.data.role,
        isaccess:validatedFields.data.isaccess,
        
      },
    })
    console.log(user)
    redirect("/login");
  }
  
  
}