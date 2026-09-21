import { notFound } from "next/navigation";

import { getBatchPerformance } from "./actions";
import PerformanceClient from "./PerformanceClient";

export default async function BatchPerformancePage({
  params,
}: {
  params: Promise<{
    batchId: string;
  }>;
}) {
  const { batchId } = await params;

  try {
    const data = await getBatchPerformance(batchId);

    return (
      <PerformanceClient
        batch={data.batch}
        month={data.month}
      />
    );
  } catch {
    notFound();
  }
}