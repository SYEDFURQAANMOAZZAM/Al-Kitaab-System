import AuthVerify from '@/app/ServerActions/auth/authVerify'
import { prisma } from "@/lib/prisma"
import SignupForm from "./registercomponent"
import { Suspense } from 'react'

export default async function Page() {
  await AuthVerify("ADMIN")
    const branches=await prisma.branch.findMany({
      include:{
        batches:true
      }
    })
    return(
        <Suspense fallback={<div>Loading...</div>}>
           <SignupForm branches={branches} />
            
        </Suspense>
    )
}


