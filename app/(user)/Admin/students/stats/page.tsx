import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";
import StudentSearch from "./StudentSearch";
import StudentTable from "./StudentTable";
import StudentPagination from "./StudentPagination";
import {  Plus } from "lucide-react";
import Link from "next/link";
import { ButtonShadcn } from "@/components/button";

interface Props {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

export default async function Page({ searchParams }: Props) {
  await AuthVerify();

  const { search = "", page = "1" } = await searchParams;

  const currentPage = Number(page);
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

  const totalStudents = await prisma.student.count({
    where,
  });

  const students = await prisma.student.findMany({
    where,

    include: {
      user: true,
      enrollments: {
        include: {
          batch: {
            include: {
              branch: true,
            },
          },
        },
      },
    },

    skip: (currentPage - 1) * pageSize,
    take: pageSize,

    
  });

  return (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-emerald-900">
          Students
        </h1>

        <p className="text-muted-foreground">
          Manage enrolled students
        </p>
      </div>

      {/* <AddStudent /> */}
      {/* or */}
      <Link href="/Admin/students/add">
        <ButtonShadcn className="bg-emerald-800 hover:bg-emerald-900 p-5">
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </ButtonShadcn>
      </Link>
    </div>

    {/* Table Card */}
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
      <div className="border-t px-5 py-4">
        <StudentPagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalStudents / pageSize)}
        />
      </div>
    </div>
  </div>
);
}