import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";

const getBranchesAndBatches = async() => {
  await AuthVerify("ADMIN","TEACHER");
  
    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        name: true,
  
        batches: {
          select: {
            id: true,
            name: true,
  
            _count: {
              select: {
                students: true,
                teachers: true,
              },
            },
          },
        },
      },
    });
    return branches;
}

export default getBranchesAndBatches