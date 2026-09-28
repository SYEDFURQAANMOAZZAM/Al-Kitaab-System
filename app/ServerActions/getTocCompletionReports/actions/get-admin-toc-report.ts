"use server";

import { requireRoleForAction } from "@/lib/auth/require-role";

import { getAdminTocReportService } from "../service/adminTocReport.service";

export async function getAdminTocReport({
  page = 1,
  search = "",
  month,
}: {
  page?: number;
  search?: string;
  month?: string;
} = {}) {
  await requireRoleForAction(["ADMIN"]);

  return getAdminTocReportService({
    page,
    search,
    month,
  });
}