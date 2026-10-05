"use client";

import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";

import type { AdminDashboardBatch } from "@/app/ServerActions/AdminDashboard/types";

type BatchAttendanceCardProps = {
  batch: AdminDashboardBatch;
};

const chartConfig = {
  attendance: {
    label: "Attendance",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function BatchAttendanceCard({
  batch,
}: BatchAttendanceCardProps) {
  const percentage = batch.attendancePercentage;

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

          <p className="mt-1 text-xs text-muted-foreground">
            {batch.studentAttendance.eligibleDays > 0 ||
            batch.teacherAttendance.eligibleDays > 0
              ? `${batch.studentAttendance.percentage}% students · ${batch.teacherAttendance.percentage}% teachers`
              : "No attendance data"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}