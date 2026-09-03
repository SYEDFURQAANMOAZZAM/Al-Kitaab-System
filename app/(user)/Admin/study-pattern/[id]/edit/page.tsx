import { notFound } from "next/navigation";
import { prisma } from '@/lib/prisma';
import { AddStudyPattern } from './AddStudyPattern'


type PageProps = {
  params: Promise<{
    id: string;
  }>;
};


const page = async ({params}:PageProps) => {

    const patternparams=await params;
    const patternId=patternparams.id

    const pattern=await prisma.pattern.findUnique({
        where:{
            id:patternId
        },
        select:{
            id:true,
            name:true,
            patternArr:{
                select:{
                    id:true,
                    name:true,
                    position:true,
                }
            },
            batches:{
                select:{
                    batchId:true,
                }
            }


        }
    })
    if(!pattern){
        notFound();
    }

    const branches = await prisma.branch.findMany({
        include: {
            batches: true,
        },
    });
  return (
    <AddStudyPattern branches={branches} pattern={pattern}/>
  )
}

export default page