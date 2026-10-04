
import BatchStudents from "@/components/BatchStudents";

type PageProps = {
  params: Promise<{
    batchId: string;
  }>;
};

export default async function BatchStudentsPage({
  params,
}: PageProps) {
  const { batchId } = await params;

  return <BatchStudents batchId={batchId} />;
}
