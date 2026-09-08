import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";

import {
  getAttendanceForAllStudents,
} from "@/databaseFetchings/AttendancePercentageFetching/getAttendanceForAllStudents";

import {
  getProgressForAllStudents,
} from "@/databaseFetchings/ProgressPercentageFetching/getProgressForAllstudents";
import StudentSearch from "./StudentSearch";
import StudentTable from "./StudentTable";
import StudentPagination from "./StudentPagination";
import StudentAttendanceFilter from "./StudentAttendanceFilter";

import { Plus } from "lucide-react";
import Link from "next/link";
import { ButtonShadcn } from "@/components/button";

interface Props {
  searchParams: Promise<{
    search?: string;
    page?: string;
    attendance?: string;
  }>;
}

const PAGE_SIZE = 15;

type AttendancePeriod =
  | "this-month"
  | "2-months"
  | "3-months"
  | "overall";

function getMonthsFromPeriod(
  period: AttendancePeriod
): number | null {
  switch (period) {
    case "this-month":
      return 1;

    case "2-months":
      return 2;

    case "3-months":
      return 3;

    case "overall":
      return null;
  }
}

export default async function Page({
  searchParams,
}: Props) {
  await AuthVerify("ADMIN");

  const {
    search = "",
    page = "1",
    attendance = "this-month",
  } = await searchParams;

  const currentPage = Math.max(
    Number(page) || 1,
    1
  );

  const trimmedSearch = search.trim();

  /*
   * =========================================================
   * Attendance period
   * =========================================================
   */

  const validPeriods: AttendancePeriod[] = [
    "this-month",
    "2-months",
    "3-months",
    "overall",
  ];

  const requestedPeriod =
    validPeriods.includes(
      attendance as AttendancePeriod
    )
      ? (attendance as AttendancePeriod)
      : "this-month";

  /*
   * =========================================================
   * Get students
   * =========================================================
   */

  const students = await prisma.student.findMany({
    select: {
      id: true,
      userId: true,

      user: {
        select: {
          name: true,
          email: true,
        },
      },

      enrollments: {
        select: {
          batch: {
            select: {
              name: true,

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

    orderBy: {
      user: {
        name: "asc",
      },
    },
  });



  const selectedMonths =
    getMonthsFromPeriod(
      requestedPeriod
    );
    

  /*
   * =========================================================
   * Run independent queries together
   *
   * Attendance:
   *   ONE GROUP BY query
   *
   * Progress:
   *   ONE GROUP BY query
   * =========================================================
   */

  const [
    attendanceMap,
    progressMap,
  ] = await Promise.all([
    getAttendanceForAllStudents(
      selectedMonths
    ),
    getProgressForAllStudents(
      selectedMonths
    ),

    
  ]);



  /*
   * =========================================================
   * Calculate global ranking
   * =========================================================
   */

  const rankedStudents = students
    .map((student) => {
      const attendance =
        attendanceMap.get(
          student.userId
        );
        

      const attendancePercentage =
        attendance?.percentage ?? 0;

      const progress =
        progressMap.get(student.id);

      const progressScore=
        progress?.averageScore ?? 0

      const progressPercentage =
        progress?.progressPercentage ?? 0;

      const overall =
        (attendancePercentage +
          progressPercentage) /
        2;

      return {
        ...student,

        stats: {
          attendance:
            attendancePercentage
            ,

          progress:
            Number(
              progressPercentage.toFixed(2)
            ),

          progressScore:Number(progressScore),
          overall:
            Number(
              overall
            ),
        },
      };
    })

    /*
     * =======================================================
     * Highest score first
     * =======================================================
     */

    .sort((a, b) => {
      if (
        b.stats.overall !==
        a.stats.overall
      ) {
        return (
          b.stats.overall -
          a.stats.overall
        );
      }

      /*
       * Tie breaker:
       * Higher progress first.
       */

      if (
        b.stats.progress !==
        a.stats.progress
      ) {
        return (
          b.stats.progress -
          a.stats.progress
        );
      }

      /*
       * Final tie breaker:
       * Alphabetical name.
       */

      return (
        (a.user.name ?? "").localeCompare(
          b.user.name ?? ""
        )
      );
    })

    /*
     * =======================================================
     * Global rank
     * =======================================================
     */

    .map((student, index) => ({
      ...student,
      rank: index + 1,
    }));

  /*
   * =========================================================
   * Search AFTER ranking
   * =========================================================
   */

  const query =
    trimmedSearch.toLowerCase();

  const filteredStudents =
    query.length > 0
      ? rankedStudents.filter(
          (student) => {
            const name =
              student.user.name
                ?.toLowerCase() ?? "";

            const email =
              student.user.email
                ?.toLowerCase() ?? "";

            return (
              name.includes(query) ||
              email.includes(query)
            );
          }
        )
      : rankedStudents;

  /*
   * =========================================================
   * Pagination AFTER ranking + search
   * =========================================================
   */

  const totalStudents =
    filteredStudents.length;

  const totalPages = Math.ceil(
    totalStudents / PAGE_SIZE
  );

  const safePage =
    totalPages > 0
      ? Math.min(
          currentPage,
          totalPages
        )
      : 1;

  const startIndex =
    (safePage - 1) *
    PAGE_SIZE;

  const paginatedStudents =
    filteredStudents.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Students
          </h1>

          <p className="text-muted-foreground">
            Manage enrolled students
          </p>
        </div>

        <Link href="/Admin/students/add">
          <ButtonShadcn className="bg-primary p-5 text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </ButtonShadcn>
        </Link>
      </div>

      {/* Student table */}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* Filters */}

        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <StudentSearch />

          <StudentAttendanceFilter
            period={requestedPeriod}
            
          />
        </div>

        {/* Table */}

        <StudentTable
          students={
            paginatedStudents
          }
        />

        {/* Pagination */}

        {totalPages > 1 && (
          <div className="border-t px-5 py-4">
            <StudentPagination
              currentPage={safePage}
              totalPages={totalPages}
            />
          </div>
          
        )}
      </div>
      
    </div>
  );
}