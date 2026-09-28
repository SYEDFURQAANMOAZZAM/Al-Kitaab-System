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

  return (
    <div className="space-y-6">
      <BatchNav
        branchId={branchId}
        batchId={batchId}
        className="sticky top-0 z-50 bg-background"
      />

      {children}
    </div>
  );
}