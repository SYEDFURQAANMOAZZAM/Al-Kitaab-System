'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const createBatch = async (formData: FormData) => {
  const batchname = formData.get("batchname")

  if (typeof batchname !== "string" || !batchname.trim()) {
    throw new Error("Batch name is required")
  }

  await prisma.batch.create({
    data: {
      batchname: batchname.trim(),
    },
  })
  revalidatePath("/Admin/branches")
}

export default createBatch