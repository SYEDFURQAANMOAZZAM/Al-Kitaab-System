import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";

import TeacherSearch from "./TeacherSearch";
import TeacherTable from "./TeacherTable";
import TeacherPagination from "./TeacherPagination";

import { Plus } from "lucide-react";
import Link from "next/link";
import { ButtonShadcn } from "@/components/button";

interface Props {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

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

  const pageSize = 15;

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

  // Total teachers matching search
  const totalTeachers = await prisma.teacher.count({
    where,
  });

  // Only fetch teachers required for current page
  const teachers = await prisma.teacher.findMany({
    where,

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

    orderBy: {
      user: {
        name: "asc",
      },
    },

    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  });

  const totalPages = Math.ceil(
    totalTeachers / pageSize
  );

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">
            Teachers
          </h1>

          <p className="text-muted-foreground">
            Manage teachers and their assignments
          </p>
        </div>

        <Link href="/Admin/teachers/add">
          <ButtonShadcn className="bg-emerald-800 p-5 hover:bg-emerald-900">
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </ButtonShadcn>
        </Link>
      </div>

      {/* Table Card */}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {/* Search */}

        <div className="border-b p-5">
          <TeacherSearch />
        </div>

        {/* Table */}

        <TeacherTable
          teachers={teachers}
          currentPage={currentPage}
          pageSize={pageSize}
        />

        {/* Pagination */}

        {totalPages > 1 && (
          <div className="border-t px-5 py-4">
            <TeacherPagination
              currentPage={currentPage}
              totalPages={totalPages}
            />
          </div>
        )}
      </div>
    </div>
  );
}