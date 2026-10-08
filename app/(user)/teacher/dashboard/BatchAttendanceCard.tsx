"use client";

import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import Link from "next/link";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";

import type { TeacherDashboardBatch } from "@/app/ServerActions/TeacherDashboard/types";

type BatchAttendanceCardProps = {
  batch: TeacherDashboardBatch;
};

const chartConfig = {
  attendance: {
    label: "Attendance",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function BatchAttendanceCard({
  batch,
}: BatchAttendanceCardProps) {
  const percentage =
    batch.attendancePercentage;

  const chartData = [
    {
      attendance: percentage,
      fill: "var(--color-attendance)",
    },
  ];

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex flex-col items-center p-4 sm:p-5">
        <ChartContainer
          config={chartConfig}
          className="aspect-square w-full max-w-[170px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={-270}
            innerRadius="72%"
            outerRadius="100%"
            barSize={12}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              tick={false}
            />

            <RadialBar
              dataKey="attendance"
              cornerRadius={10}
              background
            />

            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              <tspan
                x="50%"
                dy="-0.1em"
                className="fill-foreground text-2xl font-bold"
              >
                {percentage}%
              </tspan>

              <tspan
                x="50%"
                dy="1.7em"
                className="fill-muted-foreground text-[11px]"
              >
                Attendance
              </tspan>
            </text>
          </RadialBarChart>
        </ChartContainer>

        <div className="mt-3 w-full text-center">
          <p className="truncate text-sm font-semibold">
            {batch.name}
          </p>

          <p className="mt-1 truncate text-xs text-muted-foreground">
            {batch.branch.name}
          </p>
        </div>

        <Button
          nativeButton={false}
          render={<Link href={`/teacher/batches/${batch.id}/performance`} />}
          variant="outline"
          size="sm"
          className="mt-4 w-full"
        >
          View performance
        </Button>
      </CardContent>
    </Card>
  );
}
