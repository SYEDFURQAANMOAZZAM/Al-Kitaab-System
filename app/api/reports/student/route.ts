import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { getStudentPerformance } from "@/app/ServerActions/studentPerformance/queries";
import { getStudentMonthProgress } from "@/app/ServerActions/getProgress/services";

import { createStudentReportHtml } from "@/lib/pdf/student-report-template";
import { generateStudentReportPdf } from "@/lib/pdf/generate-student-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const studentId = searchParams.get("studentId");
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  if (
    !studentId?.trim() ||
    !Number.isInteger(month) ||
    !Number.isInteger(year) ||
    month < 1 ||
    month > 12 ||
    year < 2000 ||
    year > 2100
  ) {
    return NextResponse.json(
      { error: "Invalid report parameters." },
      { status: 400 },
    );
  }

  try {
    const [student, performance, progress] = await Promise.all([
      prisma.student.findUnique({
        where: {
          id: studentId,
        },
        select: {
          user: {
            select: {
              name: true,
            },
          },
        },
      }),

      getStudentPerformance(studentId, year, month),

      getStudentMonthProgress({
        studentId,
        year,
        month,
      }),
    ]);

    if (!student) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 },
      );
    }

    const html = createStudentReportHtml(
      performance,
      progress,
      year,
      month,
    );

    const pdf = await generateStudentReportPdf(html);

    const studentName = student.user.name
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/\s+/g, "-");

    const monthString = String(month).padStart(2, "0");

    const filename =
      `${studentName}-${year}-${monthString}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error(
      "[Student Report API] Generation failed:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to generate student report." },
      { status: 500 },
    );
  }
}