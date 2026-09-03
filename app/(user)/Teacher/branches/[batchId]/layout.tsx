import { BatchNav } from "./BatchNav";

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
      <BatchNav batchId={batchId} className="sticky top-0 z-50 bg-background" />

      {children}
    </div>
  );
}