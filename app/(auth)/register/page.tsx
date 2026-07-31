import { prisma } from "@/lib/prisma"
import SignupForm from "./registercomponent"
import { Suspense } from 'react'

export default function Page() {
    const batches=prisma.batch.findMany({})
    const branches=prisma.branch.findMany({})
    return(
        <Suspense fallback={<div>Loading...</div>}>
           <SignupForm batches={batches} branches={branches} />
            
        </Suspense>
    )
}