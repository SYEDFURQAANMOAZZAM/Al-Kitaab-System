
import { prisma } from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LEAVE";

export type BatchReportAttendance = {
  userId: string;
  date: string;
  attended: AttendanceStatus;
};

export type BatchReportStudentSummary = {
  studentId: string;
  userId: string;
  name: string;
  presentDays: number;
  eligibleDays: number;
};

export type BatchReportTeacherSummary = {
  teacherId: string;
  userId: string;
  name: string;
  presentDays: number;
  eligibleDays: number;
};

export type BatchReportProgress = {
  id: string;
  studentId: string;
  batchId: string;
  batchname: string | null;
  date: string;
  remarks: string | null;
  learnings: unknown | null;
  student: {
    id: string;
    userId: string;
    name: string;
  };
};

export type BatchReportData = {
  batch: {
    id: string;
    name: string;
  };
  attendanceTaken: {
    date: string;
    taken: boolean;
  }[];
  attendance: BatchReportAttendance[];
  students: BatchReportStudentSummary[];
  teachers: BatchReportTeacherSummary[];
  progress: BatchReportProgress[];
};

type BatchReportQueryRow = {
  batch: BatchReportData["batch"] | null;
  attendance: BatchReportAttendance[];
  students: BatchReportStudentSummary[];
  teachers: BatchReportTeacherSummary[];
  progress: BatchReportProgress[];
};

// ─── Date Helpers ───────────────────────────────────────

function getMonthRange(year: number, month: number) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

function getMonthDays(year: number, month: number): Date[] {
  const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return Array.from(
    { length: totalDays },
    (_, index) => new Date(Date.UTC(year, month - 1, index + 1))
  );
}

function dateKey(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

// ─── Main Report Query ──────────────────────────────────

export async function getBatchReportData(
  batchId: string,
  year: number,
  month: number
): Promise<BatchReportData> {
  if (
    typeof batchId !== "string" ||
    !batchId.trim() ||
    !Number.isInteger(year) ||
    year < 1900 ||
    year > 9999 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Invalid batch, year, or month.");
  }

  const { start, end } = getMonthRange(year, month);

  const [result] = await prisma.$queryRaw<BatchReportQueryRow[]>`
    WITH
    batch_data AS (
      SELECT jsonb_build_object(
        'id', b.id,
        'name', b.name
      ) AS data
      FROM "Batch" b
      WHERE b.id = ${batchId}
    ),

    attendance_data AS (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'userId', a."userId",
            'date', to_char(a.date, 'YYYY-MM-DD'),
            'attended', a.attended
          )
          ORDER BY a.date, a."userId"
        ),
        '[]'::jsonb
      ) AS data
      FROM "Attendance" a
      WHERE
        a."batchId" = ${batchId}
        AND a.date >= ${start}
        AND a.date < ${end}
    ),

    student_data AS (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'studentId', sas."studentId",
            'userId', s."userId",
            'name', u.name,
            'presentDays', sas."presentDays",
            'eligibleDays', sas."eligibleDays"
          )
          ORDER BY u.name
        ),
        '[]'::jsonb
      ) AS data
      FROM "StudentAttendanceSummary" sas
      JOIN "Student" s
        ON s.id = sas."studentId"
      JOIN "User" u
        ON u.id = s."userId"
      WHERE
        sas."batchId" = ${batchId}
        AND sas.year = ${year}
        AND sas.month = ${month}
    ),

    teacher_data AS (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'teacherId', tas."teacherId",
            'userId', t."userId",
            'name', u.name,
            'presentDays', tas."presentDays",
            'eligibleDays', tas."eligibleDays"
          )
          ORDER BY u.name
        ),
        '[]'::jsonb
      ) AS data
      FROM "TeacherAttendanceSummary" tas
      JOIN "Teacher" t
        ON t.id = tas."teacherId"
      JOIN "User" u
        ON u.id = t."userId"
      WHERE
        tas."batchId" = ${batchId}
        AND tas.year = ${year}
        AND tas.month = ${month}
    ),

    progress_data AS (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'studentId', p."studentId",
            'batchId', p."batchId",
            'batchname', p.batchname,
            'date', to_char(p.date, 'YYYY-MM-DD'),
            'remarks', p.remarks,
            'learnings', p.learnings,
            'student', jsonb_build_object(
              'id', s.id,
              'userId', s."userId",
              'name', u.name
            )
          )
          ORDER BY p.date, u.name
        ),
        '[]'::jsonb
      ) AS data
      FROM "Progress" p
      JOIN "Student" s
        ON s.id = p."studentId"
      JOIN "User" u
        ON u.id = s."userId"
      WHERE
        p."batchId" = ${batchId}
        AND p.date >= ${start}
        AND p.date < ${end}
    )

    SELECT
      (SELECT data FROM batch_data) AS batch,
      attendance_data.data AS attendance,
      student_data.data AS students,
      teacher_data.data AS teachers,
      progress_data.data AS progress
    FROM attendance_data
    CROSS JOIN student_data
    CROSS JOIN teacher_data
    CROSS JOIN progress_data;
  `;

  if (!result?.batch) {
    throw new Error("Batch not found.");
  }

  // ─── Attendance Taken Calendar ────────────────────────

  const attendanceDates = new Set(
    result.attendance.map((record) => record.date)
  );

  const attendanceTaken = getMonthDays(year, month).map((day) => {
    const date = dateKey(day);

    return {
      date,
      taken: attendanceDates.has(date),
    };
  });

  // ─── Final Result ─────────────────────────────────────

  return {
    batch: result.batch,
    attendanceTaken,
    attendance: result.attendance,
    students: result.students,
    teachers: result.teachers,
    progress: result.progress,
  };
}
