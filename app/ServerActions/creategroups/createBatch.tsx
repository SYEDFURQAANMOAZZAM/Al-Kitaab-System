'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const createBatch = async (branchId: string,formData: FormData) => {
  const batchname = formData.get("batchname")

  if (typeof batchname !== "string" || !batchname.trim()) {
    throw new Error("Batch name is required")
  }

  

  await prisma.batch.create({
    data: {
      name: batchname.trim(),
      branchId:branchId
    },
  })
  revalidatePath("/Admin/branches")
}

export default createBatch