import BatchStudents from "@/components/BatchStudents";
import { requireTeacherBatchAccess } from "@/lib/auth/require-teacher-batch";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BatchStudentsPage({
  params,
}: PageProps) {
  const { id } = await params;

  await requireTeacherBatchAccess(id);

  return <BatchStudents batchId={id} />;
}