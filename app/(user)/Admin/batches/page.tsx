import { prisma } from "@/lib/prisma"
import {CreateBatch} from "@/ServiceHandlers/CreateGroups/CreateBatch&Branch"
import AuthVerify from '@/app/ServerActions/auth/authVerify'
const page = async() => {
  const user=await AuthVerify();
  const batches=await prisma.batch.findMany({})
  return (
    <div>
      <h1>Batches</h1>
        {batches.map((batch)=>
        <li key={batch.id}>{batch.batchname}</li>  )}
        <hr />
        <h1>Create new Batches</h1>
        <CreateBatch/>
    </div>
  )
}

export default page