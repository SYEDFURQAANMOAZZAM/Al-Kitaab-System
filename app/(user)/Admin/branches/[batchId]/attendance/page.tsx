import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { AttendanceForm } from "./AtendanceForm";

export default async function Page({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  await requireRole("TEACHER", "ADMIN");

  const { batchId } = await params;

  const batch = await prisma.batch.findUnique({
    where: {
      id: batchId,
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
    },
  });

  if (!batch) {
    throw new Error("Batch not found");
  }

  




  /*
   * Fetch today's attendance for this batch.
   *
   * If records exist, the attendance has already
   * been taken.
   */
  const now = new Date();

const today = new Date(
  Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  )
);

const existingAttendance =
  await prisma.attendance.findMany({
    where: {
      batchId,
      date: today,
    },
    select: {
      userId: true,
      attended: true,
    },
  });

  const attendanceTaken =
    existingAttendance.length > 0;

  /*
   * Convert:
   *
   * [
   *   { userId: "abc", attended: "PRESENT" },
   *   { userId: "xyz", attended: "LEAVE" }
   * ]
   *
   * into:
   *
   * {
   *   abc: "PRESENT",
   *   xyz: "LEAVE"
   * }
   */
  const todayAttendance = Object.fromEntries(
    existingAttendance.map((record) => [
      record.userId,
      record.attended,
    ])
  );

  const students = batch.students.map(
    ({ student }) => ({
      id: student.id,
      userId: student.userId,
      name: student.user.name,
      phone: student.user.phone,
    })
  );


  return (
    <AttendanceForm
      batchId={batch.id}
      students={students}
      attendanceTaken={attendanceTaken}
      todayAttendance={todayAttendance}
    />
  );
}

