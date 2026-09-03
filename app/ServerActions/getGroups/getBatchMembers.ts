"use server";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

type Member = {
  id: string;
  name: string | null;
  attendance: number;
};

type StudentMember = Member & {
  progress: number;
};

export async function getBatchMembers(batchId: string) {
  await requireRoleForAction(["ADMIN", "TEACHER"]);

  /*
   * Get students and teachers belonging to this batch.
   */

  const [students, teachers] = await Promise.all([
    prisma.student.findMany({
      where: {
        enrollments: {
          some: {
            batchId,
          },
        },
      },

      select: {
        id: true,

        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        user: {
          name: "asc",
        },
      },
    }),

    prisma.teacher.findMany({
      where: {
        assignments: {
          some: {
            batchId,
          },
        },
      },

      select: {
        id: true,

        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        user: {
          name: "asc",
        },
      },
    }),
  ]);

  /*
   * User IDs for attendance lookup.
   */

  const studentUserIds = students.map(
    (student) => student.user.id
  );

  const teacherUserIds = teachers.map(
    (teacher) => teacher.user.id
  );

  const allUserIds = [
    ...studentUserIds,
    ...teacherUserIds,
  ];

  /*
   * Attendance for THIS batch only.
   */

  const attendance =
    allUserIds.length > 0
      ? await prisma.attendance.findMany({
          where: {
            batchId,

            userId: {
              in: allUserIds,
            },
          },

          select: {
            userId: true,
            attended: true,
          },
        })
      : [];

  /*
   * Progress for students in THIS batch only.
   */

  const progress =
    studentUserIds.length > 0
      ? await prisma.progress.findMany({
          where: {
            batchId,

            student: {
              userId: {
                in: studentUserIds,
              },
            },
          },

          select: {
            studentId: true,
            score: true,
          },
        })
      : [];

  /*
   * Attendance calculation
   */

  const attendanceMap = new Map<
    string,
    {
      total: number;
      present: number;
    }
  >();

  for (const record of attendance) {
    const current =
      attendanceMap.get(record.userId) ?? {
        total: 0,
        present: 0,
      };

    current.total++;

    if (record.attended === "PRESENT") {
      current.present++;
    }

    attendanceMap.set(
      record.userId,
      current
    );
  }

  /*
   * Progress calculation
   *
   * Average score for each student.
   */

  const progressMap = new Map<
    string,
    {
      total: number;
      score: number;
    }
  >();

  for (const record of progress) {
    const current =
      progressMap.get(record.studentId) ?? {
        total: 0,
        score: 0,
      };

    current.total++;
    current.score += (record.score ?? 0);

    progressMap.set(
      record.studentId,
      current
    );
  }

  /*
   * Students
   */

  const studentMembers: StudentMember[] =
    students.map((student) => {
      const attendanceData =
        attendanceMap.get(student.user.id);

      const attendancePercentage =
        attendanceData &&
        attendanceData.total > 0
          ? Math.round(
              (attendanceData.present /
                attendanceData.total) *
                100
            )
          : 0;

      const progressData =
        progressMap.get(student.id);

      const progressPercentage =
        progressData &&
        progressData.total > 0
          ? Math.round(
              progressData.score /
                progressData.total
            )
          : 0;

      return {
        id: student.id,
        name: student.user.name,

        attendance:
          attendancePercentage,

        progress:
          progressPercentage,
      };
    });

  /*
   * Teachers
   */

  const teacherMembers: Member[] =
    teachers.map((teacher) => {
      const attendanceData =
        attendanceMap.get(teacher.user.id);

      const attendancePercentage =
        attendanceData &&
        attendanceData.total > 0
          ? Math.round(
              (attendanceData.present /
                attendanceData.total) *
                100
            )
          : 0;

      return {
        id: teacher.id,
        name: teacher.user.name,

        attendance:
          attendancePercentage,
      };
    });

  return {
    students: studentMembers,
    teachers: teacherMembers,
  };
}