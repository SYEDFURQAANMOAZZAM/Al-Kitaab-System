import { BatchNav } from "@/components/BatchNav";

export default async function BatchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{
    branchId: string;
    batchId: string;
  }>;
}) {
  const { branchId, batchId } = await params;

  const basePath =
    `/teacher/branches/${branchId}/batches/${batchId}`;

  return (
    <div className="space-y-6">
      <BatchNav
        basePath={basePath}
        className="sticky top-0 z-50 bg-background"
      />

      {children}
    </div>
  );
}