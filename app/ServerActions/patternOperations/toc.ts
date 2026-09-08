"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

const TocSchema = z.object({
  patternId: z.string().min(1),
  patternArrId: z.string().min(1),
  parentId: z.string().min(1).nullable(),
  name: z.string().trim().min(1, "A title is required"),
});

export async function addTocItem(input: unknown) {
  await requireRoleForAction(["ADMIN", "TEACHER"]);
  const parsed = TocSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const { patternId, patternArrId, parentId, name } = parsed.data;
  const part = await prisma.patternArr.findFirst({ where: { id: patternArrId, patternId }, select: { position: true } });
  if (!part) return { success: false, error: "This pattern parameter does not exist." };
  if (parentId) {
    const parent = await prisma.patternTocItem.findFirst({ where: { id: parentId, patternId }, select: { patternArr: { select: { position: true } } } });
    if (!parent || parent.patternArr.position + 1 !== part.position) return { success: false, error: "A TOC item must be added below the preceding parameter." };
  } else if (part.position !== 0) return { success: false, error: "Only the first parameter can be a top-level TOC item." };
  const count = await prisma.patternTocItem.count({
    where: {
      patternId,
      patternArrId,
      parentId,
    },
  });
  await prisma.patternTocItem.create({ data: { patternId, patternArrId, parentId, name, position: count } });
  return { success: true };
}

export async function deleteTocItem(id: string) {
  await requireRoleForAction(["ADMIN", "TEACHER"]);
  await prisma.patternTocItem.delete({ where: { id } });
  return { success: true };
}

export async function setPatternTrackingStatus(patternId: string, trackingStatus: "SABAQ" | "PARASABAQ" | "AMUQTA") {
  await requireRoleForAction(["ADMIN", "TEACHER"]);
  await prisma.pattern.update({ where: { id: patternId }, data: { trackingStatus } });
  return { success: true };
}
