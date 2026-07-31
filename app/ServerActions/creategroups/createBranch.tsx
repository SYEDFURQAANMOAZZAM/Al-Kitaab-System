'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const createBranch = async (formData: FormData) => {
  const branchname = formData.get("branchname")

  if (typeof branchname !== "string" || !branchname.trim()) {
    throw new Error("Branch name is required")
  }

  await prisma.branch.create({
    data: {
      branchname: branchname.trim(),
    },
  })
  revalidatePath("/Admin/branches")
}

export default createBranch