import {
  CalendarDays,
  Check,
  CircleX,
  Clock3,
  Percent,
} from "lucide-react";

type Props = {
  totalDays: number;
  presentDays: number;
  leaveDays: number;
  absentDays: number;
  eligibleDays: number;
};

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
};

function StatCard({
  icon,
  label,
  value,
}: StatCardProps) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}

        <span className="text-sm">
          {label}
        </span>
      </div>

      <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </div>
    </div>
  );
}

export default function StudentAttendanceSummary({
  totalDays,
  presentDays,
  leaveDays,
  absentDays,
  eligibleDays,
}: Props) {
  return (
    <section className="min-w-0 w-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Attendance
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Attendance summary for the selected month.
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          icon={
            <Percent className="size-4" />
          }
          label="Attendance"
          value={`${presentDays}/${eligibleDays}`}
        />

        <StatCard
          icon={
            <CalendarDays className="size-4" />
          }
          label="Total Days"
          value={totalDays}
        />

        <StatCard
          icon={
            <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
          }
          label="Present Days"
          value={presentDays}
        />

        <StatCard
          icon={
            <Clock3 className="size-4 text-amber-600 dark:text-amber-400" />
          }
          label="Leaves"
          value={leaveDays}
        />

        <StatCard
          icon={
            <CircleX className="size-4 text-destructive" />
          }
          label="Absent"
          value={absentDays}
        />
      </div>
    </section>
  );
}