import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Attend } from "../generated/prisma/enums";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed attendance.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function attendanceDaysThisMonth(today: Date) {
  const days: Date[] = [];
  const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const lastDay = startOfDay(today);

  while (cursor <= lastDay) {
    const dayOfWeek = cursor.getUTCDay();
    if (dayOfWeek !== 0) {
      days.push(new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

function attendanceStatus(userId: string, date: Date): Attend {
  const value = [...userId].reduce((sum, character) => sum + character.charCodeAt(0), 0) + date.getUTCDate();
  return value % 9 === 0 ? Attend.ABSENT : Attend.PRESENT;
}

async function main() {
  const today = startOfDay(new Date());
  const dates = attendanceDaysThisMonth(today);
  const enrollments = await prisma.studentEnrollment.findMany({
    include: {
      student: { select: { userId: true } },
    },
  });

  let records = 0;
  for (const enrollment of enrollments) {
    for (const date of dates) {
      const attended = attendanceStatus(enrollment.student.userId, date);
      await prisma.attendance.upsert({
        where: {
          userId_date_batchId: {
            userId: enrollment.student.userId,
            date,
            batchId: enrollment.batchId,
          },
        },
        update: { attended, remarks: attended === Attend.ABSENT ? "Seeded absence" : null },
        create: {
          userId: enrollment.student.userId,
          batchId: enrollment.batchId,
          date,
          attended,
          remarks: attended === Attend.ABSENT ? "Seeded absence" : null,
        },
      });
      records += 1;
    }
  }

  console.log(`Seeded ${records} attendance records for ${enrollments.length} enrolled students from ${dates[0]?.toISOString().slice(0, 10)} through ${today.toISOString().slice(0, 10)}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
