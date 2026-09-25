"use server";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

import {
  buildTocReport,
} from "./build-toc-report";

const PAGE_SIZE = 15;

export type TeacherTocReportResult = {
  data: Awaited<
    ReturnType<typeof buildTocReport>
  >;

  page: number;
  pageSize: number;

  totalStudents: number;
  totalPages: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export async function getTeacherTocReport({
  batchIds = [],
  subjectIds = [],
  page = 1,
  search = "",
  month,
}: {
  batchIds?: string[];
  subjectIds?: string[];
  page?: number;
  search?: string;

  /**
   * YYYY-MM
   *
   * undefined = all-time
   */
  month?: string;
}): Promise<TeacherTocReportResult> {
  // ---------------------------------------------------------
  // 1. Authenticate teacher
  // ---------------------------------------------------------

  const session =
    await requireRoleForAction([
      "TEACHER",
    ]);

  const teacher =
    await prisma.teacher.findUnique({
      where: {
        userId: session.id,
      },

      select: {
        id: true,
      },
    });

  if (!teacher) {
    throw new Error(
      "Teacher profile not found",
    );
  }

  const teacherId =
    teacher.id;

  const safePage =
    Math.max(1, page);

  const skip =
    (safePage - 1) *
    PAGE_SIZE;

  const searchValue =
    search.trim();

  // ---------------------------------------------------------
  // 2. Teacher's batches
  // ---------------------------------------------------------

  const teacherAssignments =
    await prisma.teacherAssignment.findMany({
      where: {
        teacherId,

        ...(batchIds.length > 0
          ? {
              batchId: {
                in: batchIds,
              },
            }
          : {}),
      },

      select: {
        batchId: true,
      },
    });

  const allowedBatchIds =
    teacherAssignments.map(
      (assignment) =>
        assignment.batchId,
    );

  // ---------------------------------------------------------
  // 3. Teacher's subjects
  // ---------------------------------------------------------

  const teacherSubjects =
    await prisma.teacherSubject.findMany({
      where: {
        teacherId,

        ...(subjectIds.length > 0
          ? {
              subjectId: {
                in: subjectIds,
              },
            }
          : {}),
      },

      select: {
        subjectId: true,
      },
    });

  const allowedSubjectIds =
    teacherSubjects.map(
      (teacherSubject) =>
        teacherSubject.subjectId,
    );

  // ---------------------------------------------------------
  // 4. No available scope
  // ---------------------------------------------------------

  if (
    allowedBatchIds.length === 0 ||
    allowedSubjectIds.length === 0
  ) {
    return {
      data: [],

      page: safePage,
      pageSize: PAGE_SIZE,

      totalStudents: 0,
      totalPages: 0,

      hasNextPage: false,

      hasPreviousPage:
        safePage > 1,
    };
  }

  // ---------------------------------------------------------
  // 5. Find students
  // ---------------------------------------------------------

  const where = {
    ...(searchValue
      ? {
          user: {
            name: {
              contains:
                searchValue,
              mode: "insensitive" as const,
            },
          },
        }
      : {}),

    enrollments: {
      some: {
        batchId: {
          in: allowedBatchIds,
        },
      },
    },

    studentSubjects: {
      some: {
        subjectId: {
          in: allowedSubjectIds,
        },
      },
    },
  };

  // ---------------------------------------------------------
  // 6. Count
  // ---------------------------------------------------------

  const totalStudents =
    await prisma.student.count({
      where,
    });

  // ---------------------------------------------------------
  // 7. Students
  // ---------------------------------------------------------

  const students =
    await prisma.student.findMany({
      where,

      select: {
        id: true,
      },

      orderBy: {
        user: {
          name: "asc",
        },
      },

      skip,
      take: PAGE_SIZE,
    });

  const studentIds =
    students.map(
      (student) =>
        student.id,
    );

  // ---------------------------------------------------------
  // 8. Build report
  //
  // Month is passed to the shared builder.
  // Teacher authorization remains unchanged.
  // ---------------------------------------------------------

  const data =
    await buildTocReport({
      studentIds,

      subjectIds:
        allowedSubjectIds,

      month:
        month?.trim() || undefined,
    });

  const totalPages =
    Math.ceil(
      totalStudents /
        PAGE_SIZE,
    );

  return {
    data,

    page: safePage,
    pageSize: PAGE_SIZE,

    totalStudents,
    totalPages,

    hasNextPage:
      safePage < totalPages,

    hasPreviousPage:
      safePage > 1,
  };
}