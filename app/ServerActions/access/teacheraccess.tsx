'use server'
import { Access } from "@/generated/prisma/enums";
import AuthVerify from '@/app/ServerActions/auth/authVerify'
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function TeacherPermitAccess(teacherId:string){
   const user=await AuthVerify()
    const permit=await prisma.user.update({where:{id:teacherId,},data:{isaccess:Access.YES,}})
    console.log(permit)
    revalidatePath('/Admin/teacheraccess')
    revalidatePath('/teacher')
}
export async function TeacherDenyAccess(teacherId:string){
    const user=await AuthVerify()
    const permit=await prisma.user.update({where:{id:teacherId,},data:{isaccess:Access.NO,}})
    console.log(permit)
    revalidatePath('/Admin/teacheraccess')
    revalidatePath('/teacher')
}