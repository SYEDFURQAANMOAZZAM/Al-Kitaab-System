
import { NextRequest, NextResponse } from "next/server";

import { getBatchesPerformance } from "@/app/ServerActions/academyReports/queries";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { batchIds, year, month } = body as {
      batchIds?: unknown;
      year?: unknown;
      month?: unknown;
    };

    if (
      !Array.isArray(batchIds) ||
      batchIds.length === 0 ||
      batchIds.length > 100 ||
      batchIds.some(
        (id) => typeof id !== "string" || !id.trim()
      ) ||
      !Number.isInteger(year) ||
      (year as number) < 1900 ||
      (year as number) > 9999 ||
      !Number.isInteger(month) ||
      (month as number) < 1 ||
      (month as number) > 12
    ) {
      return NextResponse.json(
        { error: "Invalid batchIds, year, or month." },
        { status: 400 }
      );
    }

    // IMPORTANT:
    // Authenticate the user and verify that they have permission
    // to access every requested batch before fetching data.
    // Use your existing requireRoleForAction / batch-access
    // authorization flow here.

    const batches = await getBatchesPerformance(
      batchIds as string[],
      year as number,
      month as number
    );

    return NextResponse.json({
      success: true,
      period: { year, month },
      totalBatches: batches.length,
      data: batches,
    });
  } catch (error) {
    console.error("Academy attendance report API error:", error);

    return NextResponse.json(
      { error: "Failed to fetch academy attendance report." },
      { status: 500 }
    );
  }
}
