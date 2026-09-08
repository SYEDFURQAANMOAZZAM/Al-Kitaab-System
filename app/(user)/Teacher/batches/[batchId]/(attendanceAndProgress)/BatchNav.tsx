"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";



export function BatchNav({
  batchId,
  className,
}: {
  batchId: string;
  className?: string;
}) {
  const pathname = usePathname();

  const progressPath = `/Teacher/batches/${batchId}/progress`;
  const attendancePath = `/Teacher/batches/${batchId}/attendance`;

  const activeTab = pathname.startsWith(progressPath)
    ? "progress"
    : pathname.startsWith(attendancePath)
      ? "attendance"
      : "progress";

  return (
    <Tabs value={activeTab} className={className}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="progress">
          <Link href={progressPath}>Progress</Link>
        </TabsTrigger>

        <TabsTrigger value="attendance">
          <Link href={attendancePath}>Attendance</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}