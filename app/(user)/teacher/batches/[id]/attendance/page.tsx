import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireTeacherBatchAccess } from "@/lib/auth/require-teacher-batch";
import { AttendanceForm } from "@/components/AttendanceForm";

import {
  getAttendanceForDate,
} from "@/app/ServerActions/attendanceOperations/actions/attendance.actions";

function getTodayDate() {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ),
  );
}

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AttendancePage({
  params,
}: PageProps) {
  const { id } = await params;

  await requireTeacherBatchAccess(id);

  const batch = await prisma.batch.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,

      students: {
        select: {
          student: {
            select: {
              id: true,
              userId: true,
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      },

      teachers: {
        select: {
          teacher: {
            select: {
              id: true,
              userId: true,
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!batch) {
    notFound();
  }

  const today = getTodayDate();

  const existingAttendance = await prisma.attendance.findMany({
    where: {
      batchId: id,
      date: today,
    },
    select: {
      userId: true,
      attended: true,
    },
  });

  const attendanceTaken = existingAttendance.length > 0;

  const todayAttendance = Object.fromEntries(
    existingAttendance.map((record) => [
      record.userId,
      record.attended,
    ]),
  );

  const students = batch.students.map(({ student }) => ({
    id: student.id,
    userId: student.userId,
    name: student.user.name,
    phone: student.user.phone,
  }));

  const teachers = batch.teachers.map(({ teacher }) => ({
    id: teacher.id,
    userId: teacher.userId,
    name: teacher.user.name,
    phone: teacher.user.phone,
  }));

  return (
    <AttendanceForm
      batchId={batch.id}
      batchName={batch.name}
      students={students}
      teachers={teachers}
      initialDate={today}
      attendanceTaken={attendanceTaken}
      todayAttendance={todayAttendance}
      getAttendanceForDate={getAttendanceForDate}
    />
  );
}