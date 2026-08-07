import AuthVerify from "@/app/ServerActions/auth/authVerify"
import { prisma } from "@/lib/prisma"
import { error } from "console";


const page = async() => {
    const user=await AuthVerify()
    const userId=user.id;
    const teacher=await prisma.teacher.findFirst({where:{userId:userId}})
    if (!teacher) {
       throw error("Teacher is null")
     }
    
    const batch=await prisma.batch.findFirst({where:{id:teacher.batchId}})
  return (
    <div>{batch?.batchname}</div>
  )
}

export default page