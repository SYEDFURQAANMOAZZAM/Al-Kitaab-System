import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";

import StudentSearch from "./StudentSearch";
import StudentTable from "./StudentTable";
import StudentPagination from "./StudentPagination";

import { Plus } from "lucide-react";
import Link from "next/link";
import { ButtonShadcn } from "@/components/button";

interface Props {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

export default async function Page({ searchParams }: Props) {
  await AuthVerify("ADMIN");

  const {
    search = "",
    page = "1",
  } = await searchParams;

  // ===========================
  // Pagination
  // ===========================

  const currentPage = Math.max(
    Number(page) || 1,
    1
  );

  const pageSize = 15;

  // ===========================
  // Search
  // ===========================

  const where = {
    user: {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
      ],
    },
  };

  // ===========================
  // Total Students
  // ===========================

  const totalStudents = await prisma.student.count({
    where,
  });

  const totalPages = Math.ceil(
    totalStudents / pageSize
  );

  // ===========================
  // Students
  // ===========================

  const students = await prisma.student.findMany({
    where,

    select: {
      id: true,

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

    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  });

  return (
    <div className="space-y-6">
      {/* ===========================
          Header
      ============================ */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">
            Students
          </h1>

          <p className="text-muted-foreground">
            Manage enrolled students
          </p>
        </div>

        <Link href="/Admin/students/add">
          <ButtonShadcn className="bg-emerald-800 p-5 hover:bg-emerald-900">
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </ButtonShadcn>
        </Link>
      </div>

      {/* ===========================
          Table Card
      ============================ */}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {/* Search */}

        <div className="border-b p-5">
          <StudentSearch />
        </div>

        {/* Table */}

        <StudentTable
          students={students}
          currentPage={currentPage}
          pageSize={pageSize}
        />

        {/* Pagination */}

        {totalPages > 1 && (
          <div className="border-t px-5 py-4">
            <StudentPagination
              currentPage={currentPage}
              totalPages={totalPages}
            />
          </div>
        )}
      </div>
    </div>
  );
}