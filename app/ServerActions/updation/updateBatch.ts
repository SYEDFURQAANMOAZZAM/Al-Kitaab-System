'use server'
import { Prisma } from "@/generated/prisma/client";
import { requireRole, requireRoleForAction } from "@/lib/auth/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type GroupActionState = { error?: string; success?: string } | undefined;

const UpdateBatch = async (batchId:string, _state: GroupActionState, formData: FormData): Promise<GroupActionState> => {
  await requireRoleForAction(["ADMIN"]);
  const batchname = formData.get("batchName");

  if (typeof batchname !== "string" || !batchname.trim()) {
    return { error: "Batch name is required." };
  }
  try {
    await prisma.batch.update({where:{id:batchId}, data:{ name: batchname }});
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "A batch with this name already exists." };
    }
    console.error("Unable to update batch", error);
    return { error: "Unable to update batch. Please try again." };
  }

  revalidatePath("/Admin/branches");
  return { success: "Batch updated." };
}
export default UpdateBatch