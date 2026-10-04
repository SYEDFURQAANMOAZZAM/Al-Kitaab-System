import BatchTeachers from "@/components/BatchTeachers";
import { requireTeacherBatchAccess } from "@/lib/auth/require-teacher-batch";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  await requireTeacherBatchAccess(id);

  return <BatchTeachers batchId={id} isAdmin={false} />;
}