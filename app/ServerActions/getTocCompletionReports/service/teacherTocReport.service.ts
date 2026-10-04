import {
  countStudents,
  findStudents,
  findTeacherByUserId,
  findTeacherAssignments,
  findTeacherSubjects,
} from "../queries/tocReport.queries";

import { buildTocReport } from "./buildTocReport";

const PAGE_SIZE = 15;

export async function getTeacherTocReportService({
  teacherUserId,
  batchIds = [],
  subjectIds = [],
  page = 1,
  search = "",
  month,
}: {
  teacherUserId: string;
  batchIds?: string[];
  subjectIds?: string[];
  page?: number;
  search?: string;
  month?: string;
}) {
  const teacher =
    await findTeacherByUserId(teacherUserId);

  if (!teacher) {
    throw new Error(
      "Teacher profile not found"
    );
  }

  const teacherId = teacher.id;

  const safePage = Math.max(1, page);
  const skip =
    (safePage - 1) * PAGE_SIZE;

  const searchValue = search.trim();

  const [
    teacherAssignments,
    teacherSubjects,
  ] = await Promise.all([
    findTeacherAssignments(
      teacherId,
      batchIds
    ),

    findTeacherSubjects(
      teacherId,
      subjectIds
    ),
  ]);

  const allowedBatchIds =
    teacherAssignments.map(
      (item) => item.batchId
    );

  const allowedSubjectIds =
    teacherSubjects.map(
      (item) => item.subjectId
    );

  if (allowedBatchIds.length === 0) {
  return {
    data: [],
    page: safePage,
    pageSize: PAGE_SIZE,
    totalStudents: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: safePage > 1,
  };
}

const where = {
  ...(searchValue
    ? {
        user: {
          name: {
            contains: searchValue,
            mode: "insensitive" as const,
          },
        },
      }
    : {}),

  enrollments: {
    some: {
      batchId: {
        in: allowedBatchIds,
      },
    },
  },
};

const [totalStudents, students] =
  await Promise.all([
    countStudents(where),
    findStudents(where, skip, PAGE_SIZE),
  ]);

const data = await buildTocReport({
  studentIds: students.map((student) => student.id),
  subjectIds: allowedSubjectIds,
  month: month?.trim() || undefined,
});

  const totalPages =
    Math.ceil(
      totalStudents / PAGE_SIZE
    );

  return {
    data,
    page: safePage,
    pageSize: PAGE_SIZE,
    totalStudents,
    totalPages,
    hasNextPage:
      safePage < totalPages,
    hasPreviousPage:
      safePage > 1,
  };
}