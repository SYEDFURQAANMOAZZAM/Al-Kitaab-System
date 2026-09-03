"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

export async function getTodayProgress(batchId: string) {
  await requireRole("TEACHER", "ADMIN");

  // Today's date in IST
  const indiaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const today = new Date(`${indiaDate}T00:00:00.000Z`);

  return prisma.progress.findMany({
    where: {
      batchId,
      date: today,
    },
    select: {
      id: true,
      studentId: true,
      date: true,
      learnings: true,
    },
  });
}