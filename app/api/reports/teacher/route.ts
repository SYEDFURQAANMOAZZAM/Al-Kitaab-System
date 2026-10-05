import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

import { getTeacherPerformance } from "@/app/ServerActions/TeacherPerformance/queries";

import { createTeacherReportHtml } from "@/lib/pdf/teacher-report-template";
import { generateTeacherReportPdf } from "@/lib/pdf/generate-teacher-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const teacherId = searchParams.get("teacherId");
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  if (
    !teacherId?.trim() ||
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
    await requireRole("ADMIN", "TEACHER");

    const [teacher, performance] = await Promise.all([
      prisma.teacher.findUnique({
        where: {
          id: teacherId,
        },
        select: {
          user: {
            select: {
              name: true,
            },
          },
        },
      }),

      getTeacherPerformance(
        teacherId,
        month,
        year,
      ),
    ]);

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found." },
        { status: 404 },
      );
    }

    const html = createTeacherReportHtml(
      performance,
      year,
      month,
    );

    const pdf = await generateTeacherReportPdf(html);

    const teacherName = teacher.user.name
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/\s+/g, "-");

    const monthString = String(month).padStart(2, "0");

    const filename =
      `${teacherName}-${year}-${monthString}.pdf`;

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
      "[Teacher Report API] Generation failed:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to generate teacher report." },
      { status: 500 },
    );
  }
}