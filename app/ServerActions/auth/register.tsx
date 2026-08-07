'use server'

import { prisma } from "@/lib/prisma"
import { FormStateRegister, SignupFormSchema } from "./Validate"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";

 
export async function register(state: FormStateRegister, formData: FormData) {
  // Validate form fields
  const validatedFields = SignupFormSchema.safeParse({
  name: formData.get("name"),
  email: formData.get("email"),
  phone: formData.get("phone"),
  password: formData.get("password"),
  confirmPassword: formData.get("confirmPassword"),
  role: formData.get("role"),
  branchId: formData.get("branchId"),
  batch: JSON.parse(formData.get("batch") as string),
});

//if any form field is invalid, return the errors
if (!validatedFields.success) {
  return {
    errors: validatedFields.error.flatten().fieldErrors,
  };
}

// const batches = await prisma.batch.findMany({
//   where: {
//     id: {
//       in: validatedFields.data.batch,
//     },
//   },
//   select: {
//     id: true,
//     branchId: true,
//   },
// });

// const valid = batches.every((batch) =>
//   validatedFields.data.branch.includes(batch.branchId)
// );

// if (!valid) {
//   return {
//     error: "One or more selected batches do not belong to the selected branches.",
//   };
// }
 
  
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
    const data: Prisma.UserCreateInput = {
  name: validatedFields.data.name,
  email: validatedFields.data.email,
  phone: validatedFields.data.phone,
  password: hashedPassword,
  role: validatedFields.data.role,
};
    
  //  const batch = await prisma.batch.findFirst({
  //    where: {
  //      name: {
  //         in: validatedFields.data.batch,
  //       },
  //      },
  //    });

  //    if (!batch) {
  //      return {
  //        message: "Batch not found",
  //      };
  //    }

  //    const branch = await prisma.branch.findFirst({
  //    where: {
  //      name: {
  //         in: validatedFields.data.branch,
  //       },
  //      },
  //    });

  //    if (!branch) {
  //      return {
  //        message: "Branch not found",
  //      };
  //    }

    // if (validatedFields.data.role === Role.TEACHER) {
    //   data.teacher = {
    //     create: {
    //       assignments:{
    //         create: {
    //           batchId: batch.id,
              
    //       }
    //     },
    //   }
    // };
    // } else if (validatedFields.data.role === Role.STUDENT) {
    //   data.student = {
    //     create: {
    //       enrollments:{
    //         create: {
    //           batchId: batch.id,
              
    //       }
    //     },
    //   },
    //   };
    // }

    await prisma.user.create({ data });
    
    

    console.log(data)
    redirect("/login");
  }
  
  
}
