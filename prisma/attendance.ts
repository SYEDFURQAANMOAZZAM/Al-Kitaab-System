import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Attend, Role, Studied } from "../generated/prisma/enums";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed attendance.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

type AttendanceTarget = {
  userId: string;
  batchId: string;
  batchname: string;
};

type ProgressTarget = {
  studentId: string;
  batchId: string;
  batchname: string;
};

function getAttendanceStatus(
  day: number,
  targetIndex: number,
  role: Role
): Attend {
  const variation =
    (day + targetIndex * 3 + (role === Role.TEACHER ? 1 : 0)) % 10;

  if (variation === 2 || variation === 6 || variation === 9) {
    return Attend.ABSENT;
  }

  return Attend.PRESENT;
}

function getStudiedStatus(
  day: number,
  targetIndex: number
): Studied {
  const variation = (day + targetIndex * 2) % 10;

  if (variation === 1 || variation === 4 || variation === 8) {
    return Studied.NO;
  }

  return Studied.YES;
}

function getProgressScore(
  day: number,
  targetIndex: number,
  studied: Studied
): number {
  const variation = (day + targetIndex * 7) % 36;

  if (studied === Studied.YES) {
    return 65 + variation;
  }

  return variation;
}

async function main() {
  // Delete existing test data
  await prisma.attendance.deleteMany();
  await prisma.progress.deleteMany();

  const users = await prisma.user.findMany({
    where: {
      role: {
        in: [Role.STUDENT, Role.TEACHER],
      },
    },
    include: {
      student: {
        include: {
          enrollments: {
            include: {
              batch: true,
            },
          },
        },
      },
      teacher: {
        include: {
          assignments: {
            include: {
              batch: true,
            },
          },
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  const targets: Array<AttendanceTarget & { role: Role }> = [];
  const progressTargets: ProgressTarget[] = [];

  for (const user of users) {
    const batches =
      user.role === Role.STUDENT
        ? user.student?.enrollments.map(({ batch }) => batch)
        : user.teacher?.assignments.map(({ batch }) => batch);

    if (!batches?.length) {
      console.warn(
        `Skipping ${user.name}: no batch assignment found.`
      );
      continue;
    }

    for (const batch of batches) {
      targets.push({
        userId: user.id,
        batchId: batch.id,
        batchname: batch.name,
        role: user.role,
      });

      if (user.role === Role.STUDENT && user.student) {
        progressTargets.push({
          studentId: user.student.id,
          batchId: batch.id,
          batchname: batch.name,
        });
      }
    }
  }

  const now = new Date();

  // Current month/year according to server timezone
  const year = now.getFullYear();
  const month = now.getMonth();

  // Number of days to seed = yesterday
  // Example: Aug 31 -> seed Aug 1 through Aug 30
  const daysToSeed = now.getDate() - 1;

  const attendance = [];
  const progress = [];

  for (let day = 1; day <= daysToSeed; day += 1) {
    // Date-only value
    const date = new Date(Date.UTC(year, month, day));

    for (
      let targetIndex = 0;
      targetIndex < targets.length;
      targetIndex += 1
    ) {
      const target = targets[targetIndex];

      const attended = getAttendanceStatus(
        day,
        targetIndex,
        target.role
      );

      attendance.push({
        userId: target.userId,
        batchId: target.batchId,
        batchname: target.batchname,
        attended,
        remarks:
          attended === Attend.ABSENT ? "Absent" : null,
        date,
      });
    }

    for (
      let targetIndex = 0;
      targetIndex < progressTargets.length;
      targetIndex += 1
    ) {
      const target = progressTargets[targetIndex];

      const studied = getStudiedStatus(
        day,
        targetIndex
      );

      const score = getProgressScore(
        day,
        targetIndex,
        studied
      );

      progress.push({
        studentId: target.studentId,
        batchId: target.batchId,
        batchname: target.batchname,
        studied,
        remarks:
          studied === Studied.NO
            ? "Not studied"
            : "Studied",
        score,
        date,
      });
    }
  }

  await prisma.attendance.createMany({
    data: attendance,
  });

  await prisma.progress.createMany({
    data: progress,
  });

  console.log(
    `Seeded ${attendance.length} attendance records for ${year}-${String(
      month + 1
    ).padStart(2, "0")} through day ${daysToSeed}.`
  );

  console.log(
    `Seeded ${progress.length} progress records for ${year}-${String(
      month + 1
    ).padStart(2, "0")} through day ${daysToSeed}.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });