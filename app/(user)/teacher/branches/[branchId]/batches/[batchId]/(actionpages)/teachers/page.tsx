import BatchTeachers from "@/components/BatchTeachers";

type PageProps = {
  params: Promise<{
    batchId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { batchId } = await params;

  return <BatchTeachers batchId={batchId} isAdmin={false} />;
}