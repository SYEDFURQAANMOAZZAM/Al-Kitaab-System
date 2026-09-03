import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";

import TeacherSearch from "./TeacherSearch";
import TeacherTable from "./TeacherTable";
import TeacherPagination from "./TeacherPagination";

interface Props {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 15;

export default async function Page({
  searchParams,
}: Props) {
  await AuthVerify("ADMIN");

  const {
    search = "",
    page = "1",
  } = await searchParams;

  const currentPage = Math.max(
    Number(page) || 1,
    1
  );

  const query = search.trim().toLowerCase();

  // =========================================================
  // 1. GET ALL TEACHERS
  // =========================================================

  const teachers = await prisma.teacher.findMany({
    select: {
      id: true,

      user: {
        select: {
          name: true,
          email: true,

          attendance: {
            select: {
              attended: true,
            },
          },
        },
      },

      assignments: {
        select: {
          batch: {
            select: {
              id: true,

              branch: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // =========================================================
  // 2. CALCULATE ATTENDANCE FOR EVERY TEACHER
  // =========================================================

  const rankedTeachers = teachers
    .map((teacher) => {
      const attendance =
        teacher.user.attendance;

      const totalAttendance =
        attendance.length;

      const presentCount =
        attendance.filter(
          (record) =>
            record.attended === "PRESENT"
        ).length;

      const attendancePercentage =
        totalAttendance > 0
          ? Math.round(
              (presentCount /
                totalAttendance) *
                100
            )
          : 0;

      return {
        ...teacher,

        attendancePercentage,
      };
    })

    // =======================================================
    // 3. GLOBAL RANKING
    // =======================================================

    .sort((a, b) => {
      // Higher attendance = better rank
      if (
        b.attendancePercentage !==
        a.attendancePercentage
      ) {
        return (
          b.attendancePercentage -
          a.attendancePercentage
        );
      }

      // Tie breaker: teacher name
      return (
        (a.user.name ?? "").localeCompare(
          b.user.name ?? ""
        )
      );
    })

    // =======================================================
    // 4. ASSIGN GLOBAL RANK
    // =======================================================

    .map((teacher, index) => ({
      ...teacher,
      rank: index + 1,
    }));

  // =========================================================
  // 5. SEARCH AFTER RANKING
  // =========================================================

  const filteredTeachers = query
    ? rankedTeachers.filter((teacher) => {
        const name =
          teacher.user.name?.toLowerCase() ?? "";

        const email =
          teacher.user.email?.toLowerCase() ?? "";

        return (
          name.includes(query) ||
          email.includes(query)
        );
      })
    : rankedTeachers;

  // =========================================================
  // 6. PAGINATION AFTER SEARCH
  // =========================================================

  const totalTeachers =
    filteredTeachers.length;

  const totalPages = Math.ceil(
    totalTeachers / PAGE_SIZE
  );

  const safePage =
    totalPages > 0
      ? Math.min(currentPage, totalPages)
      : 1;

  const startIndex =
    (safePage - 1) * PAGE_SIZE;

  const paginatedTeachers =
    filteredTeachers.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Teachers
        </h1>

        <p className="text-muted-foreground">
          Manage teachers
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-5">
          <TeacherSearch />
        </div>

        <TeacherTable
          teachers={paginatedTeachers}
        />

        {totalPages > 1 && (
          <div className="border-t px-5 py-4">
            <TeacherPagination
              currentPage={safePage}
              totalPages={totalPages}
            />
          </div>
        )}
      </div>
    </div>
  );
}