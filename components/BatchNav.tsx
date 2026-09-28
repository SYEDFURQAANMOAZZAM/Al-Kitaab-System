"use client";

import { usePathname, useRouter } from "next/navigation";

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type BatchNavProps = {
  branchId: string;
  batchId: string;
  className?: string;
};

export function BatchNav({
  branchId,
  batchId,
  className,
}: BatchNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const basePath = `/admin/branches/${branchId}/batches/${batchId}`;

  const progressPath = `${basePath}/progress`;
  const attendancePath = `${basePath}/attendance`;
  const performancePath = `${basePath}/performance`;

  const activeTab = pathname.startsWith(attendancePath)
    ? "attendance"
    : pathname.startsWith(performancePath)
      ? "performance"
      : "progress";

  function handleTabChange(value: string) {
    switch (value) {
      case "progress":
        router.push(progressPath);
        break;

      case "attendance":
        router.push(attendancePath);
        break;

      case "performance":
        router.push(performancePath);
        break;
    }
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className={className}
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="progress">
          Progress
        </TabsTrigger>

        <TabsTrigger value="attendance">
          Attendance
        </TabsTrigger>

        <TabsTrigger value="performance">
          Performance
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}