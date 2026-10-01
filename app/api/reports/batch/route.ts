import { NextRequest, NextResponse } from "next/server";

import { requireRoleForAction } from "@/lib/auth/require-role";

import { getBatchPerformance } from "@/app/ServerActions/batchPerformance/queries";
import { getBatchStudentsMonthProgress } from "@/app/ServerActions/getProgress/services";

import { generateBatchReportPdf } from "@/lib/pdf/generate-batch-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRoleForAction(["ADMIN", "TEACHER"]);

    console.log("[Batch API] Authenticated:", user.id);

    const { searchParams } = new URL(request.url);

    const batchId = searchParams.get("batchId");
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));

    if (
      !batchId?.trim() ||
      !Number.isInteger(year) ||
      year < 2000 ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return NextResponse.json(
        { error: "Invalid batchId, year, or month" },
        { status: 400 }
      );
    }

    console.log("[Batch API] Fetching performance");

    const performance = await getBatchPerformance(
      batchId,
      year,
      month
    );

    console.log("[Batch API] Performance fetched");

    console.log("[Batch API] Fetching progress");

    const progress = await getBatchStudentsMonthProgress({
      batchId,
      year,
      month,
    });

    console.log("[Batch API] Progress fetched:", progress.length);

    console.log("[Batch API] Generating PDF");

    const pdf = await generateBatchReportPdf({
      performance,
      progress,
      year,
      month,
    });

    console.log("[Batch API] PDF generated");

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="batch-report.pdf"',
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[Batch API] Error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate batch report",
      },
      { status: 500 }
    );
  }
}