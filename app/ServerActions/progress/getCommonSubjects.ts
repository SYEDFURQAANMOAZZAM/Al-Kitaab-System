"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

export async function getCommonSubjects(
  studentId: string,
  batchId: string,
) {
  const user = await requireRole("ADMIN", "TEACHER");

  /* ============================================================
     STUDENT SUBJECTS
  ============================================================ */

  const studentSubjects = await prisma.studentSubject.findMany({
    where: {
      studentId,
    },

    select: {
      subject: {
        select: {
          id: true,
          name: true,

          parts: {
            orderBy: {
              position: "asc",
            },

            select: {
              id: true,
              name: true,
              position: true,
            },
          },

          tocItems: {
            orderBy: {
              position: "asc",
            },

            select: {
              id: true,
              name: true,
              parentId: true,
              subjectPartId: true,
              position: true,
            },
          },

          trackingTerms: {
            orderBy: {
              position: "asc",
            },

            select: {
              id: true,
              name: true,
              position: true,
            },
          },
        },
      },
    },
  });

  /* ============================================================
     BATCH SUBJECTS
  ============================================================ */

  const batchSubjects = await prisma.batchSubject.findMany({
    where: {
      batchId,
    },

    select: {
      subjectId: true,
    },
  });

  const batchSubjectIds = new Set(
    batchSubjects.map((item) => item.subjectId),
  );

  /* ============================================================
     ADMIN
     Student Subjects ∩ Batch Subjects
  ============================================================ */

  if (user.role === "ADMIN") {
    return studentSubjects
      .filter((item) =>
        batchSubjectIds.has(item.subject.id),
      )
      .map((item) => item.subject);
  }

  /* ============================================================
     TEACHER SUBJECTS
  ============================================================ */

  const teacherSubjects = await prisma.teacherSubject.findMany({
    where: {
      teacher: {
        userId: user.id,
      },
    },

    select: {
      subjectId: true,
    },
  });

  const teacherSubjectIds = new Set(
    teacherSubjects.map((item) => item.subjectId),
  );

  /* ============================================================
     TEACHER
     Student Subjects ∩ Batch Subjects ∩ Teacher Subjects
  ============================================================ */

  return studentSubjects
    .filter((item) => {
      const subjectId = item.subject.id;

      return (
        batchSubjectIds.has(subjectId) &&
        teacherSubjectIds.has(subjectId)
      );
    })
    .map((item) => item.subject);
}