"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

type ProgressLearning = {
  learningId: string;

  pattern: {
    id: string;
    name: string;
  } | null;

  status: string;

  parts: {
    id: string;
    name: string;
    position: number;
    value: string | { from: string; to?: string };
  }[];
};

type SubmitProgressInput = {
  studentId: string;
  batchId: string;
  batchName: string;
  learnings: ProgressLearning[];
};

export async function submitProgress(
  data: SubmitProgressInput
) {
  await requireRole("TEACHER", "ADMIN");

  // Get today's date in India (IST)
  const indiaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  // Convert YYYY-MM-DD into a Date representing that date
  const today = new Date(`${indiaDate}T00:00:00.000Z`);

  const progress = await prisma.progress.upsert({
    where: {
      studentId_date_batchId: {
        studentId: data.studentId,
        batchId: data.batchId,
        date: today,
      },
    },

    create: {
      studentId: data.studentId,
      batchId: data.batchId,
      batchname: data.batchName,
      date: today,
      learnings: data.learnings,
    },

    update: {
      batchname: data.batchName,
      learnings: data.learnings,
    },
  });

  for (const learning of data.learnings) {
    if (!learning.pattern) continue;
    const pattern = await prisma.pattern.findUnique({ where: { id: learning.pattern.id }, select: { trackingStatus: true, patternArr: { orderBy: { position: "asc" }, select: { id: true } } } });
    if (!pattern || learning.status !== pattern.trackingStatus || !pattern.patternArr[0]) continue;
    const primary = learning.parts.find((part) => part.id === pattern.patternArr[0].id);
    const raw = primary?.value;
    const primaryTocId = typeof raw === "object" && raw ? (raw.to || raw.from) : undefined;
    const studentPattern = await prisma.studentPattern.findUnique({ where: { studentId_patternId: { studentId: data.studentId, patternId: learning.pattern.id } }, select: { id: true } });
    if (!studentPattern) continue;
    await prisma.studentOverallProgress.upsert({
      where: { studentPatternId: studentPattern.id },
      create: { studentId: data.studentId, patternId: learning.pattern.id, studentPatternId: studentPattern.id, trackingStatus: pattern.trackingStatus, currentValues: learning.parts, currentPrimaryTocItemId: primaryTocId },
      update: { trackingStatus: pattern.trackingStatus, currentValues: learning.parts, currentPrimaryTocItemId: primaryTocId },
    });
  }

  return {
    success: true,
    progressId: progress.id,
  };
}
