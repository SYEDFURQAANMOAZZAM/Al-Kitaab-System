import { Phone, Users } from "lucide-react";
import StudentActions from "./StudentActions";

type Student = {
  id: string;

  user: {
    name: string;
    phone: string | null;
  };

  _count: {
    enrollments: number;
  };
};

export default function StudentTable({
  students,
}: {
  students: Student[];
}) {
  if (students.length === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Users className="size-5 text-muted-foreground" />
        </div>

        <h3 className="font-semibold">No students found</h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Try searching with a different name or phone number.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Student
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Phone
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Batches
              </th>

              <th className="w-16 px-4 py-3" />
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-b transition-colors last:border-0 hover:bg-muted/30"
              >
                {/* Name */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <StudentAvatar name={student.user.name} />

                    <span className="font-medium">
                      {student.user.name}
                    </span>
                  </div>
                </td>

                {/* Phone */}
                <td className="px-4 py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4" />

                    {student.user.phone ? (
                    <a
                        href={`tel:${student.user.phone}`}
                        className="font-medium text-primary hover:underline"
                    >
                        {student.user.phone}
                    </a>
                    ) : (
                    <span>Not provided</span>
                    )}
                </div>
                </td>

                {/* Batches */}
                <td className="px-4 py-4">
                  <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    {student._count.enrollments}{" "}
                    {student._count.enrollments === 1
                      ? "Batch"
                      : "Batches"}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-4">
                  <StudentActions
                    studentId={student.id}
                    studentName={student.user.name}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="divide-y md:hidden">
        {students.map((student) => (
          <div key={student.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <StudentAvatar name={student.user.name} />

                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {student.user.name}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4" />

                    {student.user.phone ? (
                    <a
                        href={`tel:${student.user.phone}`}
                        className="font-medium text-primary hover:underline"
                    >
                        {student.user.phone}
                    </a>
                    ) : (
                    <span>Not provided</span>
                    )}
                </div>

                  <span className="mt-2 inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    {student._count.enrollments}{" "}
                    {student._count.enrollments === 1
                      ? "Batch"
                      : "Batches"}
                  </span>
                </div>
              </div>

              <StudentActions
                studentId={student.id}
                studentName={student.user.name}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function StudentAvatar({
  name,
}: {
  name: string;
}) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}