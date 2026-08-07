import AuthVerify from '@/app/ServerActions/auth/authVerify'
import { prisma } from '@/lib/prisma';

const page = async() => {
  const user=await AuthVerify();
  const teachers=await prisma.teacher.findMany({
    include:{
      user:true
    }
  })
  return (
    <div>{teachers.map((teacher)=>(
      <li key={teacher.id}>{teacher.user.name}</li>
    ))}</div>
  )
}

export default page