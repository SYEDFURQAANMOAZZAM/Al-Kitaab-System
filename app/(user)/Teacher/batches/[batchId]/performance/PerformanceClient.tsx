"use client";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Progress } from "@/components/ui/progress";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type StudentPerformance = {
  id: string;
  name: string;
  attendancePercent: number;
  progressPercent: number;
};

type Props = {
  batch: {
    id: string;
    name: string;
    studentCount: number;
    teacherCount: number;
  };

  month: {
    year: number;
    month: number;
    daywiseAttendance: {
      date: string;
      attendancePercent: number;
    }[];
    students: StudentPerformance[];
  };
};

export default function PerformanceClient({
  batch,
  month,
}: Props) {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-semibold">
          {batch.name} Performance
        </h1>

        <p className="text-muted-foreground">
          Attendance and progress overview
        </p>
      </div>

      {/* SUMMARY */}

      <div className="grid gap-4 sm:grid-cols-2">

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Students
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-3xl font-bold">
              {batch.studentCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Teachers
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-3xl font-bold">
              {batch.teacherCount}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* DAYWISE ATTENDANCE */}

      <Card>
        <CardHeader>
          <CardTitle>
            Attendance — This Month
          </CardTitle>
        </CardHeader>

        <CardContent>
          {month.daywiseAttendance.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No attendance recorded this month.
            </p>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={month.daywiseAttendance}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      value.slice(8)
                    }
                  />

                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) =>
                      `${value}%`
                    }
                  />

                  <Tooltip
                    formatter={(value) =>
                      `${value}%`
                    }
                  />

                  <Line
                    type="monotone"
                    dataKey="attendancePercent"
                    name="Attendance"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* STUDENT TABLE */}

      <Card>
        <CardHeader>
          <CardTitle>
            This Month
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">

          <Table>

            <TableHeader>
              <TableRow>
                <TableHead>
                  Student
                </TableHead>

                <TableHead>
                  Attendance
                </TableHead>

                <TableHead>
                  Progress
                </TableHead>

                <TableHead className="text-right">
                  Detail
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>

              {month.students.map((student) => (
                <TableRow key={student.id}>

                  <TableCell className="font-medium">
                    {student.name}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress
                        value={student.attendancePercent}
                        className="w-[100px]"
                      />

                      <span>
                        {student.attendancePercent}%
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress
                        value={student.progressPercent}
                        className="w-[100px]"
                      />

                      <span>
                        {student.progressPercent}%
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <Link
                      href={`/Teacher/batches/${batch.id}/students/${student.id}/performance`}
                      className="text-sm underline"
                    >
                      View
                    </Link>
                  </TableCell>

                </TableRow>
              ))}

            </TableBody>

          </Table>

        </CardContent>
      </Card>

    </div>
  );
}