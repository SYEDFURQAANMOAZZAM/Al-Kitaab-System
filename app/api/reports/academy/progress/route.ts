
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { queryStudentsMonthProgress } from "@/app/ServerActions/academyProgressReports/queries";

export const runtime = "nodejs";

const requestSchema = z.object({
  studentIds: z
    .array(z.string().min(1))
    .min(1)
    .max(1000),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

function getMonthRange(year: number, month: number) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

function getDaysInMonth(year: number, month: number): Date[] {
  const totalDays = new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();

  return Array.from({ length: totalDays }, (_, index) =>
    new Date(Date.UTC(year, month - 1, index + 1))
  );
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body: unknown = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { year, month } = parsed.data;

    // Remove duplicate student IDs
    const studentIds = [
      ...new Set(parsed.data.studentIds),
    ];

    // Authenticate and authorize the caller here.
    // Verify access to all requested students before
    // returning any student data.

    const { start, end } = getMonthRange(year, month);

    // Fetch students and progress in parallel
    const [students, progresses] = await Promise.all([
      prisma.student.findMany({
        where: {
          id: {
            in: studentIds,
          },
        },
        select: {
          id: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      }),

      queryStudentsMonthProgress({
        studentIds,
        year,
        month,
      }),
    ]);

    // Map student IDs to names
    const studentMap = new Map(
      students.map((student) => [
        student.id,
        student.user.name,
      ])
    );

    // Group progress records by student ID
    const progressMap = new Map<
      string,
      typeof progresses
    >();

    for (const progress of progresses) {
      const existing = progressMap.get(
        progress.studentId
      );

      if (existing) {
        existing.push(progress);
      } else {
        progressMap.set(progress.studentId, [progress]);
      }
    }

    // Generate all dates in the requested month
    const days = getDaysInMonth(year, month);

    // Build monthly progress for each existing student
    const data = studentIds
      .filter((studentId) => studentMap.has(studentId))
      .map((studentId) => {
        const studentProgress =
          progressMap.get(studentId) ?? [];

        // Group progress by date, preserving all batches
        const byDate = new Map<
          string,
          typeof studentProgress
        >();

        for (const progress of studentProgress) {
          const key = dateKey(progress.date);
          const existing = byDate.get(key);

          if (existing) {
            existing.push(progress);
          } else {
            byDate.set(key, [progress]);
          }
        }

        // Include every day, even when no progress exists
        return {
          studentId,
          studentName: studentMap.get(studentId)!,
          days: days.map((date) => {
            const key = dateKey(date);

            return {
              date: key,
              progresses: byDate.get(key) ?? [],
            };
          }),
        };
      });

    return NextResponse.json({
      success: true,
      period: {
        year,
        month,
        start: start.toISOString(),
        end: end.toISOString(),
      },
      totalStudents: data.length,
      data,
    });
  } catch (error) {
    console.error(
      "Academy progress report API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch academy progress reports",
      },
      { status: 500 }
    );
  }
}
