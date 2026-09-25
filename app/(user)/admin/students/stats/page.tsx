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

const PAGE_SIZE = 15;

export default async function Page({ searchParams }: Props) {
  await AuthVerify("ADMIN");

  const { search = "", page = "1" } = await searchParams;

  const currentPage = Math.max(Number(page) || 1, 1);
  const trimmedSearch = search.trim();

  const where = trimmedSearch
    ? {
        user: {
          OR: [
            {
              name: {
                contains: trimmedSearch,
                mode: "insensitive" as const,
              },
            },
            
          ],
        },
      }
    : {};

  const [students, totalStudents] = await Promise.all([
    prisma.student.findMany({
      where,
      select: {
        id: true,

        user: {
          select: {
            name: true,
            phone: true,
          },
        },

        _count: {
          select: {
            enrollments: true,
          },
        },
      },

      orderBy: {
        user: {
          name: "asc",
        },
      },

      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),

    prisma.student.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(totalStudents / PAGE_SIZE);

  const safePage =
    totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Students
          </h1>

          <p className="text-muted-foreground">
            Manage enrolled students
          </p>
        </div>

        <Link href="/admin/students/add">
          <ButtonShadcn className="bg-primary px-5 text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </ButtonShadcn>
        </Link>
      </div>

      {/* Students */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* Search */}
        <div className="border-b p-4 sm:p-5">
          <StudentSearch />
        </div>

        {/* Table */}
        <StudentTable students={students} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t px-4 py-4 sm:px-5">
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