import AuthVerify from '@/app/ServerActions/auth/authVerify'
import { prisma } from "@/lib/prisma"
import {AccessgrantStudent,AccessdenyStudent} from '@/ServiceHandlers/AccessHandler/AccessStudent'

const StudentAccess = async() => {
   const user=await AuthVerify()
   const StudentAccessed=await prisma.user.findMany({where:{role:'STUDENT',isaccess:'YES'}})
   const StudentNotAccessed=await prisma.user.findMany({where:{role:'STUDENT',isaccess:'NO'}})
  return (
    <div>
       <div>
        <h1>Student Accessed</h1>
        <div>
            {StudentAccessed.map((student)=>(
                <li key={student.id}>{student.name}
                <AccessdenyStudent studentId={student.id}/>
                </li>
            ))}
        </div>
       </div>
       <hr />

       <div>
          <h1>Student Not Accessed</h1>
          <div>
            {StudentNotAccessed.map((student)=>(
                <li key={student.id}>{student.name}
                <AccessgrantStudent studentId={student.id}/>
                </li>
            ))}
          </div>
       </div>

    </div>
  )
}

export default StudentAccess