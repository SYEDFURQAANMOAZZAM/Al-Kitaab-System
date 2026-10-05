"use server";

import { getAdminDashboard } from "./service";
import { requireRole } from "@/lib/auth/require-role";
import type {
  GetAdminDashboardInput,
  AdminDashboardResult,
} from "./types";

export async function getAdminDashboardAction(
  input: GetAdminDashboardInput,
): Promise<AdminDashboardResult> {
    await requireRole("ADMIN");
  const { month, year } = input;

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Invalid month");
  }

  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100
  ) {
    throw new Error("Invalid year");
  }

  return getAdminDashboard({
    month,
    year,
  });
}