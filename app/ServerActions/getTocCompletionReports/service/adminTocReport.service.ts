import {
  countStudents,
  findStudents,
} from "../queries/tocReport.queries";

import { buildTocReport } from "./buildTocReport";

const PAGE_SIZE = 15;

export async function getAdminTocReportService({
  page = 1,
  search = "",
  month,
}: {
  page?: number;
  search?: string;
  month?: string;
}) {
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * PAGE_SIZE;

  const searchValue = search.trim();

  const where = searchValue
    ? {
        user: {
          name: {
            contains: searchValue,
            mode: "insensitive" as const,
          },
        },
      }
    : undefined;

  const [totalStudents, students] =
    await Promise.all([
      countStudents(where),
      findStudents(where, skip, PAGE_SIZE),
    ]);

  const data = await buildTocReport({
    studentIds: students.map(
      (student) => student.id
    ),
    month: month?.trim() || undefined,
  });

  const totalPages =
    Math.ceil(totalStudents / PAGE_SIZE);

  return {
    data,
    page: safePage,
    pageSize: PAGE_SIZE,
    totalStudents,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
}