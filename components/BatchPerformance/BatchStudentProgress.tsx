import StudentBatchMonthProgressBox from "@/components/StudentBatchMonthProgressBox";

type Student = {
  id: string;
  name: string;
};

type Props = {
  students: Student[];
  batchId: string;
  year: number;
  month: number;
};

export default function BatchStudentProgress({
  students,
  batchId,
  year,
  month,
}: Props) {
  return (
    <section className="min-w-0 w-full overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-4">
        <h2 className="text-lg font-semibold text-foreground">
          Progress of Students
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Expand a student to load their monthly
          progress.
        </p>
      </div>

      <div className="min-w-0 space-y-2 p-3">
        {students.map((student) => (
          <StudentBatchMonthProgressBox
            key={`${student.id}:${batchId}:${year}:${month}`}
            studentId={student.id}
            batchId={batchId}
            year={year}
            month={month}
            studentName={student.name}
          />
        ))}
      </div>
    </section>
  );
}