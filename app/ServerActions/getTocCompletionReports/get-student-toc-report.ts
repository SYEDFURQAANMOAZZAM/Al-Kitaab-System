"use server";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

import {
  buildTocReport,
} from "./build-toc-report";

export async function getStudentTocReport() {
  // ---------------------------------------------------------
  // 1. Authenticate student
  // ---------------------------------------------------------

  const session =
    await requireRoleForAction([
      "STUDENT",
    ]);

  // session.id = User.id
  // Student.id is a different ID.

  const student =
    await prisma.student.findUnique({
      where: {
        userId: session.id,
      },

      select: {
        id: true,
      },
    });

  if (!student) {
    throw new Error(
      "Student profile not found",
    );
  }

  // ---------------------------------------------------------
  // 2. Build only this student's report
  // ---------------------------------------------------------

  return buildTocReport({
    studentIds: [
      student.id,
    ],
  });
}

