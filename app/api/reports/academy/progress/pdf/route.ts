
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { generateAcademyProgressReport } from "@/lib/pdf/generate-academy-progress-report";
import type { StudentsMonthProgress } from "@/app/ServerActions/academyProgressReports/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  success: z.literal(true),
  period: z.object({
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
  }),
  data: z.array(
    z.object({
      studentId: z.string().min(1),
      studentName: z.string(),
      days: z.array(z.object({
        date: z.string(),
        progresses: z.array(z.unknown()),
      })),
    })
  ).min(1).max(1000),
});

export async function POST(request: NextRequest) {
  try {
    await AuthVerify("ADMIN", "TEACHER");

    const body: unknown = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid progress report data." },
        { status: 400 }
      );
    }

    const { year, month } = parsed.data.period;

const students: (StudentsMonthProgress & { studentName: string })[] =
  parsed.data.data.map((student) => ({
    studentId: student.studentId,
    studentName: student.studentName,
    days: student.days.map((day) => ({
      date: new Date(day.date),
      progresses: day.progresses as StudentsMonthProgress["days"][number]["progresses"],
    })),
  }));

    const pdf = await generateAcademyProgressReport(
      students,
      year,
      month
    );

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="academy-progress-${year}-${String(month).padStart(2, "0")}.pdf"`,
        "Content-Length": String(pdf.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Progress PDF generation error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to generate progress PDF." },
      { status: 500 }
    );
  }
}
