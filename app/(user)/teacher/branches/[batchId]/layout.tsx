import { BatchNav } from "@/components/BatchNav";

export default async function BatchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;

  return (
    <div className="space-y-6">
      <BatchNav
        batchId={batchId}
        basePath="/admin/branches"
        className="sticky top-0 z-50 bg-background"
      />

      {children}
    </div>
  );
}

