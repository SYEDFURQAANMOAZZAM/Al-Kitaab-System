
import { prisma } from '@/lib/prisma';
import { AddStudyPattern } from './AddStudyPattern'



const page = async () => {

    const branches = await prisma.branch.findMany({
        include: {
            batches: true,
        },
    });
  return (
    <AddStudyPattern branches={branches} />
  )
}

export default page