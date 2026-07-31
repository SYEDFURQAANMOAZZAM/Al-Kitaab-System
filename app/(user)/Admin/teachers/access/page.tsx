import AuthVerify from '@/app/ServerActions/auth/authVerify'
import { prisma } from "@/lib/prisma"
import {AccessgrantTeacher,AccessdenyTeacher} from '@/ServiceHandlers/AccessHandler/AccessTeacher'
const TeacherAccess = async() => {
  const user=await AuthVerify()
   const TeacherAccessed=await prisma.user.findMany({where:{role:'TEACHER',isaccess:'YES'}})
   const TeacherNotAccessed=await prisma.user.findMany({where:{role:'TEACHER',isaccess:'NO'}})
   console.log("is this server cmponernt")
  return (
    <div>
       <div>
        <h1>Teachers Accessed</h1>
        <div>
            {TeacherAccessed.map((teacher)=>(
                <li key={teacher.id}>{teacher.name}
                <AccessdenyTeacher teacherId={teacher.id}/>
                </li>
            ))}
        </div>
       </div>
       <hr />

       <div>
          <h1>Teachers Not Accessed</h1>
          <div>
            {TeacherNotAccessed.map((teacher)=>(
                <li key={teacher.id}>{teacher.name}
                <AccessgrantTeacher teacherId={teacher.id}/>
                </li>
            ))}
          </div>
       </div>

    </div>
  )
}

export default TeacherAccess