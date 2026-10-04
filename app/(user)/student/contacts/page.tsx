
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import {
  Mail,
  Phone,
  ContactRound,
  ShieldCheck,
  GraduationCap,
  Users,
  ArrowUpRight,
  BookOpen,
} from "lucide-react";

export default async function StudentContactsPage() {
  const user = await requireRole("STUDENT");

  const [student, admins] = await Promise.all([
    prisma.student.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        enrollments: {
          select: {
            batch: {
              select: {
                id: true,
                name: true,
                teachers: {
                  select: {
                    teacher: {
                      select: {
                        id: true,
                        user: {
                          select: {
                            name: true,
                            email: true,
                            phone: true,
                            phone2: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),

    prisma.user.findMany({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phone2: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  // Collect teachers from the student's enrolled batches.
  // A teacher assigned to multiple batches appears only once.
  const teacherMap = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      phone2: string | null;
      batches: Set<string>;
    }
  >();

  for (const enrollment of student?.enrollments ?? []) {
    const batch = enrollment.batch;

    for (const assignment of batch.teachers) {
      const teacher = assignment.teacher;
      const teacherUser = teacher.user;

      const existing = teacherMap.get(teacher.id);

      if (existing) {
        existing.batches.add(batch.name);
      } else {
        teacherMap.set(teacher.id, {
          id: teacher.id,
          name: teacherUser.name,
          email: teacherUser.email,
          phone: teacherUser.phone,
          phone2: teacherUser.phone2,
          batches: new Set([batch.name]),
        });
      }
    }
  }

  const teachers = Array.from(teacherMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const totalContacts = admins.length + teachers.length;

  function getInitials(name: string) {
    return (
      name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "?"
    );
  }

  function ContactCard({
    name,
    email,
    phone,
    phone2,
    type,
    batches,
  }: {
    name: string;
    email: string;
    phone: string | null;
    phone2: string | null;
    type: "Administrator" | "Teacher";
    batches?: string[];
  }) {
    const phones = [phone, phone2].filter(
      (value): value is string => Boolean(value?.trim())
    );

    const isAdmin = type === "Administrator";

    return (
      <article className="group flex min-w-0 flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
        {/* Identity */}
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
              isAdmin
                ? "bg-primary/10 text-primary"
                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
            }`}
          >
            {getInitials(name)}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold">{name}</h3>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {isAdmin ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                <GraduationCap className="h-3.5 w-3.5" />
              )}
              {type}
            </div>
          </div>
        </div>

        {/* Teacher batch details */}
        {batches && batches.length > 0 && (
          <div className="mt-4 rounded-xl bg-muted/50 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              Assigned batches
            </div>

            <div className="flex flex-wrap gap-1.5">
              {batches.map((batch) => (
                <span
                  key={batch}
                  className="rounded-md border bg-background px-2 py-1 text-xs font-medium"
                >
                  {batch}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contact details */}
        <div className="mt-5 space-y-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-muted p-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Email address</p>
              <a
                href={`mailto:${email}`}
                className="break-all text-sm font-medium hover:text-primary hover:underline"
              >
                {email}
              </a>
            </div>
          </div>

          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-muted p-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Phone number</p>

              {phones.length > 0 ? (
                <div className="space-y-1">
                  {phones.map((number, index) => (
                    <a
                      key={`${number}-${index}`}
                      href={`tel:${number}`}
                      className="block text-sm font-medium hover:text-primary hover:underline"
                    >
                      {number}
                      {index === 1 && (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          (Alternate)
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not provided
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-5 flex gap-2 border-t pt-4">
          <a
            href={`mailto:${email}`}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Mail className="h-4 w-4" />
            Email
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>

          {phones[0] ? (
            <a
              href={`tel:${phones[0]}`}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
          ) : (
            <span className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              No phone
            </span>
          )}
        </div>
      </article>
    );
  }

  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl space-y-8">
      {/* Header */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ContactRound className="h-4 w-4" />
          <span>Student Portal</span>
          <span>/</span>
          <span className="text-foreground">Contacts</span>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Contact Directory
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Connect with your teachers and institute administration
              whenever you need assistance.
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-xl border bg-card px-4 py-2.5">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {totalContacts} {totalContacts === 1 ? "Contact" : "Contacts"}
            </span>
          </div>
        </div>
      </section>

      {/* Teachers */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold sm:text-xl">
                My Teachers
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Teachers assigned to your enrolled batches
            </p>
          </div>

          <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
            {teachers.length}
          </span>
        </div>

        {teachers.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {teachers.map((teacher) => (
              <ContactCard
                key={teacher.id}
                name={teacher.name}
                email={teacher.email}
                phone={teacher.phone}
                phone2={teacher.phone2}
                type="Teacher"
                batches={Array.from(teacher.batches).sort((a, b) =>
                  a.localeCompare(b)
                )}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-card px-5 py-10 text-center">
            <GraduationCap className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h3 className="font-semibold">No teachers assigned</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Teacher contacts for your enrolled batches will appear here.
            </p>
          </div>
        )}
      </section>

      {/* Administrators */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold sm:text-xl">
                Administration
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Contact the institute administration for general assistance
            </p>
          </div>

          <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
            {admins.length}
          </span>
        </div>

        {admins.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {admins.map((admin) => (
              <ContactCard
                key={admin.id}
                name={admin.name}
                email={admin.email}
                phone={admin.phone}
                phone2={admin.phone2}
                type="Administrator"
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-card px-5 py-10 text-center">
            <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h3 className="font-semibold">No administrators found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Administration contact details are currently unavailable.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
