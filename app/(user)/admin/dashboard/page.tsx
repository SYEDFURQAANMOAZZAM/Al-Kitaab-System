import { requireRole } from "@/lib/auth/require-role";
import { getAdminDashboardAction } from "@/app/ServerActions/AdminDashboard/action";
import { AdminDashboard } from "./AdminDashboard";

type PageProps = {
  searchParams: Promise<{
    month?: string;
    year?: string;
  }>;
};

export default async function AdminDashboardPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const now = new Date();

  const parsedMonth = Number(params.month);
  const parsedYear = Number(params.year);

  const month =
    Number.isInteger(parsedMonth) &&
    parsedMonth >= 1 &&
    parsedMonth <= 12
      ? parsedMonth
      : now.getMonth() + 1;

  const year =
    Number.isInteger(parsedYear) &&
    parsedYear >= 2000 &&
    parsedYear <= 2100
      ? parsedYear
      : now.getFullYear();

  const user = await requireRole("ADMIN");

  const dashboard = await getAdminDashboardAction({
    month,
    year,
  });

  return (
    <AdminDashboard
      dashboard={dashboard}
      adminName={user.name}
      month={month}
      year={year}
    />
  );
}