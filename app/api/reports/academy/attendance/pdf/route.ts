import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { generateAcademyAttendanceReport } from "@/lib/pdf/generate-academy-attendance-report";
import type { BatchPerformanceData } from "@/app/ServerActions/academyReports/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  success: z.literal(true),

  period: z.object({
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
  }),

  data: z.array(z.unknown()).min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    await AuthVerify("ADMIN", "TEACHER");

    const body: unknown = await request.json();

    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid attendance report data.",
        },
        { status: 400 },
      );
    }

    const { year, month } = parsed.data.period;

    const batches =
      parsed.data.data as BatchPerformanceData[];

    const pdf =
      await generateAcademyAttendanceReport({
        batches,
        year,
        month,
      });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,

      headers: {
        "Content-Type": "application/pdf",

        "Content-Disposition":
          `attachment; filename="academy-attendance-${year}-${String(month).padStart(2, "0")}.pdf"`,

        "Content-Length": String(pdf.length),

        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "Attendance PDF generation error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate attendance PDF.",
      },
      { status: 500 },
    );
  }
}