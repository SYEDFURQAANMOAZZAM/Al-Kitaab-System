'use server'
import { Access } from "@/generated/prisma/enums";
import AuthVerify from '@/app/ServerActions/auth/authVerify'
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function StudentPermitAccess(studentId:string){
   const user=await AuthVerify()
    const permit=await prisma.user.update({where:{id:studentId,},data:{isaccess:Access.YES,}})
    console.log(permit)
    revalidatePath('/Admin/studentaccess')
    revalidatePath('/student')
}
export async function StudentDenyAccess(studentId:string){
    const user=await AuthVerify()
    const permit=await prisma.user.update({where:{id:studentId,},data:{isaccess:Access.NO,}})
    console.log(permit)
    revalidatePath('/Admin/studentaccess')
    revalidatePath('/student')
}