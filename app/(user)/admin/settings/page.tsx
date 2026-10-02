import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";
import AcademyBackup from "./AcademyBackup";

const Page = async () => {
  await AuthVerify("ADMIN");

  const [batches, students] = await Promise.all([
    prisma.batch.findMany({
      select: { id: true },
    }),
    prisma.student.findMany({
      select: { id: true },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl p-3 sm:p-5">
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Academy Backups
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Export monthly attendance and student progress reports.
        </p>
      </div>

      <AcademyBackup
        batchIds={batches.map((batch) => batch.id)}
        studentIds={students.map((student) => student.id)}
      />
    </main>
  );
};

export default Page;
