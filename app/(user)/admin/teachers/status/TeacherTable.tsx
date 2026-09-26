import {
  Phone,
  Users,
  BookOpen,
} from "lucide-react";

import TeacherActions from "./TeacherActions";

type Teacher = {
  id: string;

  user: {
    name: string;
    phone: string | null;
  };

  _count: {
    assignments: number;
    teacherSubjects: number;
  };
};

export default function TeacherTable({
  teachers,
}: {
  teachers: Teacher[];
}) {
  if (teachers.length === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Users className="size-5 text-muted-foreground" />
        </div>

        <h3 className="font-semibold">
          No teachers found
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Try searching with a different name
          or phone number.
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
                Teacher
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Phone
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Batches
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Subjects
              </th>

              <th className="w-16 px-4 py-3" />
            </tr>
          </thead>

          <tbody>
            {teachers.map((teacher) => (
              <tr
                key={teacher.id}
                className="border-b transition-colors last:border-0 hover:bg-muted/30"
              >
                {/* Name */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <TeacherAvatar
                      name={
                        teacher.user.name
                      }
                    />

                    <span className="font-medium">
                      {teacher.user.name}
                    </span>
                  </div>
                </td>

                {/* Phone */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4" />

                    {teacher.user.phone ? (
                      <a
                        href={`tel:${teacher.user.phone}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {teacher.user.phone}
                      </a>
                    ) : (
                      <span>
                        Not provided
                      </span>
                    )}
                  </div>
                </td>

                {/* Batches */}
                <td className="px-4 py-4">
                  <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    {teacher._count
                      .assignments}{" "}
                    {teacher._count
                      .assignments === 1
                      ? "Batch"
                      : "Batches"}
                  </span>
                </td>

                {/* Subjects */}
                <td className="px-4 py-4">
                  <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {teacher._count
                      .teacherSubjects}{" "}
                    {teacher._count
                      .teacherSubjects === 1
                      ? "Subject"
                      : "Subjects"}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-4">
                  <TeacherActions
                    teacherId={
                      teacher.id
                    }
                    teacherName={
                      teacher.user.name
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="divide-y md:hidden">
        {teachers.map((teacher) => (
          <div
            key={teacher.id}
            className="p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <TeacherAvatar
                  name={
                    teacher.user.name
                  }
                />

                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {teacher.user.name}
                  </p>

                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4" />

                    {teacher.user.phone ? (
                      <a
                        href={`tel:${teacher.user.phone}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {
                          teacher.user
                            .phone
                        }
                      </a>
                    ) : (
                      <span>
                        Not provided
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                      <Users className="size-3" />
                      {
                        teacher._count
                          .assignments
                      }{" "}
                      {teacher._count
                        .assignments ===
                      1
                        ? "Batch"
                        : "Batches"}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      <BookOpen className="size-3" />
                      {
                        teacher._count
                          .teacherSubjects
                      }{" "}
                      {teacher._count
                        .teacherSubjects ===
                      1
                        ? "Subject"
                        : "Subjects"}
                    </span>
                  </div>
                </div>
              </div>

              <TeacherActions
                teacherId={
                  teacher.id
                }
                teacherName={
                  teacher.user.name
                }
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function TeacherAvatar({
  name,
}: {
  name: string;
}) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {name
        .charAt(0)
        .toUpperCase()}
    </div>
  );
}