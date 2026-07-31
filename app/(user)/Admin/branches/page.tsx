import { prisma } from "@/lib/prisma"
import {CreateBranch} from "@/ServiceHandlers/CreateGroups/CreateBatch&Branch"
import AuthVerify from '@/app/ServerActions/auth/authVerify'
const page = async() => {
  const user=await AuthVerify();
  const branches=await prisma.branch.findMany({})
  return (
    <div>
      <h1>Branches</h1>
        {branches.map((branch)=>
        <li key={branch.id}>{branch.branchname}</li>  )}
        <hr />
        <h1>Create new Branches</h1>
        <CreateBranch/>
    </div>
  )
}

export default page