'use server'
import { Prisma } from "@/generated/prisma/client";
import { requireRole, requireRoleForAction } from "@/lib/auth/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type GroupActionState = { error?: string; success?: string } | undefined;

const UpdateBranch = async (branchId:string, _state: GroupActionState, formData: FormData): Promise<GroupActionState> => {
  await requireRoleForAction(["ADMIN"]);
  const branchname = formData.get("branchName");

  if (typeof branchname !== "string" || !branchname.trim()) {
    return { error: "Branch name is required." };
  }
  try {
    await prisma.branch.update({where:{id:branchId}, data:{ name: branchname }});
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "A branch with this name already exists." };
    }
    console.error("Unable to update branch", error);
    return { error: "Unable to update branch. Please try again." };
  }

  revalidatePath("/Admin/branches");
  return { success: "Branch updated." };
}
export default UpdateBranch