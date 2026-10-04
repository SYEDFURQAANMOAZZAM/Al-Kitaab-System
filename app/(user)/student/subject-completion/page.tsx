
import { requireRole } from "@/lib/auth/require-role";
import { getStudentTocReport } from "@/app/ServerActions/getTocCompletionReports/actions/get-student-toc-report";
import StudentSubjectsCompletion from "./StudentSubjectsCompletion";

export default async function StudentSubjectsCompletionPage() {
  await requireRole("STUDENT");

  const report = await getStudentTocReport();

  return <StudentSubjectsCompletion initialReport={report} />;
}
