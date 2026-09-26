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
            {
              phone: {
                contains: trimmedSearch,
                mode: "insensitive" as const,
              },
            },
          ],
        },
      }
    : {};

  const [teachers, totalTeachers] =
    await Promise.all([
      prisma.teacher.findMany({
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
              assignments: true,
              teacherSubjects: true,
            },
          },
        },

        orderBy: {
          user: {
            name: "asc",
          },
        },

        skip:
          (currentPage - 1) *
          PAGE_SIZE,

        take: PAGE_SIZE,
      }),

      prisma.teacher.count({
        where,
      }),
    ]);

  const totalPages = Math.ceil(
    totalTeachers / PAGE_SIZE
  );

  const safePage =
    totalPages > 0
      ? Math.min(
          currentPage,
          totalPages
        )
      : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Teachers
          </h1>

          <p className="text-muted-foreground">
            Manage academy teachers
          </p>
        </div>

        <Link href="/admin/teachers/add">
          <ButtonShadcn className="bg-primary px-5 text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </ButtonShadcn>
        </Link>
      </div>

      {/* Teachers */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* Search */}
        <div className="border-b p-4 sm:p-5">
          <TeacherSearch />
        </div>

        {/* Table */}
        <TeacherTable teachers={teachers} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t px-4 py-4 sm:px-5">
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