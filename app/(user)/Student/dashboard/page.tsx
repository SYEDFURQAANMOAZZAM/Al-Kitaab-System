import { getCurrentUser } from "@/lib/auth/session";
import { getStudentTrackingDashboard } from "@/app/ServerActions/progress/getStudentTracking";

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") return null;

  const student = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/student?userId=${user.id}`, { cache: "no-store" }).then(async (res) => {
    if (!res.ok) return null;
    return res.json();
  }).catch(() => null);

  if (!student?.id) return <div className="p-6 text-sm text-muted-foreground">No student profile found.</div>;

  const dashboards = await getStudentTrackingDashboard({
    studentId: student.id,
    fromDate: "2026-09-01",
    toDate: "2026-09-30",
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">Student dashboard</p>
        <h1 className="text-3xl font-bold">Tracking overview</h1>
      </div>

      {dashboards.map(({ subject, summary, trackingTerms }) => (
        <div key={subject.id} className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{subject.name}</h2>
              <p className="text-sm text-muted-foreground">{summary?.trackingTerm?.name ?? trackingTerms[0]?.name ?? "No tracking term"}</p>
            </div>
            <div className="rounded-full border px-3 py-1 text-sm font-medium">
              {summary ? `${summary.overall.percentage}% complete` : "No data"}
            </div>
          </div>

          {summary ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase text-muted-foreground">Date range</p>
                  <p className="mt-2 text-sm font-medium">{summary.dateRange.from} → {summary.dateRange.to}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase text-muted-foreground">Overall completion</p>
                  <p className="mt-2 text-sm font-medium">{summary.overall.completedLeaves}/{summary.overall.totalLeaves} leaves</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase text-muted-foreground">Current position</p>
                  <p className="mt-2 text-sm font-medium">{Object.values(summary.currentPosition).join(", ") || "0"}</p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-medium">Completion by part</h3>
                <div className="space-y-2">
                  {summary.partCompletion.map((part) => (
                    <div key={part.partId}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>{part.partName}</span>
                        <span>{part.completed}/{part.total}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${part.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-medium">Completed items</h3>
                <div className="flex flex-wrap gap-2">
                  {summary.completedItems.length ? summary.completedItems.map((item) => (
                    <span key={item.id} className="rounded-full border bg-muted px-2 py-1 text-xs">{item.name}</span>
                  )) : <span className="text-sm text-muted-foreground">No completed items yet.</span>}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tracking data available for this subject.</p>
          )}
        </div>
      ))}
    </div>
  );
}
