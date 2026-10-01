
import { NextRequest, NextResponse } from "next/server";

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
      { status: 400 }
    );
  }

  try {
    await requireRole("ADMIN", "TEACHER");

    const performance = await getTeacherPerformance(
      teacherId,
      month,
      year
    );

    const html = createTeacherReportHtml(
      performance,
      year,
      month
    );

    const pdf = await generateTeacherReportPdf(html);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="teacher-report-${year}-${String(month).padStart(2, "0")}.pdf"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error(
      "[Teacher Report API] Generation failed:",
      error
    );

    return NextResponse.json(
      { error: "Failed to generate teacher report." },
      { status: 500 }
    );
  }
}
