import type { ReactNode } from "react";

import { BatchNav } from "@/components/BatchNav";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{
    id: string;
  }>;
};

export default async function BatchLayout({
  children,
  params,
}: LayoutProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <BatchNav basePath={`/teacher/batches/${id}`} />
      {children}
    </div>
  );
}