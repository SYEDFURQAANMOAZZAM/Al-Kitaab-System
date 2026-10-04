
import Link from "next/link";

import {
  Mail,
  Phone,
  User,
  Users,
  BookOpen,
  Pencil,
} from "lucide-react";

import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";
import { ButtonShadcn } from "@/components/button";

export default async function TeacherProfilePage() {
  const session = await AuthVerify("TEACHER");

  const teacher = await prisma.teacher.findUnique({
    where: {
      userId: session.id,
    },
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
      assignments: {
        select: {
          batch: {
            select: {
              id: true,
              name: true,
              branch: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          batch: {
            name: "asc",
          },
        },
      },
      teacherSubjects: {
        select: {
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          subject: {
            name: "asc",
          },
        },
      },
    },
  });

  if (!teacher) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
          <User className="size-6 text-muted-foreground" />
        </div>

        <h1 className="text-xl font-semibold">
          Profile not found
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Your teacher profile could not be found.
          Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <User className="size-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              My Profile
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your personal information and view your assignments.
            </p>
          </div>
        </div>

        <Link href="/teacher/profile/edit">
          <ButtonShadcn className="w-full gap-2 sm:w-auto">
            <Pencil className="size-4" />
            Edit Profile
          </ButtonShadcn>
        </Link>
      </div>

      {/* Profile Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Teacher Overview */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary ring-4 ring-primary/5">
              {teacher.user.name.charAt(0).toUpperCase()}
            </div>

            <h2 className="mt-4 text-xl font-semibold text-foreground">
              {teacher.user.name}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Teacher
            </p>

            <div className="mt-5 flex w-full items-center justify-center gap-6 border-t pt-5">
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums">
                  {teacher.assignments.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Batches
                </p>
              </div>

              <div className="h-9 w-px bg-border" />

              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums">
                  {teacher.teacherSubjects.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Subjects
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6 lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Personal Information
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your registered contact details.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <InfoItem
              label="Full Name"
              value={teacher.user.name}
            />

            <InfoItem
              label="Email Address"
              value={teacher.user.email}
              icon={<Mail className="size-4" />}
            />

            <InfoItem
              label="Phone Number"
              value={teacher.user.phone}
              href={
                teacher.user.phone
                  ? `tel:${teacher.user.phone}`
                  : undefined
              }
              icon={<Phone className="size-4" />}
            />

            <InfoItem
              label="Alternate Phone"
              value={teacher.user.phone2}
              href={
                teacher.user.phone2
                  ? `tel:${teacher.user.phone2}`
                  : undefined
              }
              icon={<Phone className="size-4" />}
            />
          </div>
        </div>

        {/* Batches */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="size-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                My Batches
              </h2>
              <p className="text-xs text-muted-foreground">
                Your assigned classes
              </p>
            </div>
          </div>

          {teacher.assignments.length > 0 ? (
            <div className="max-h-80 space-y-3 overflow-y-auto">
              {teacher.assignments.map(({ batch }) => (
                <div
                  key={batch.id}
                  className="rounded-xl border bg-muted/20 p-3 transition-colors hover:bg-muted/50"
                >
                  <p className="font-medium text-foreground">
                    {batch.name}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {batch.branch.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <Users className="mx-auto mb-2 size-6 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                No batches assigned yet.
              </p>
            </div>
          )}
        </div>

        {/* Subjects */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6 lg:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                My Subjects
              </h2>
              <p className="text-xs text-muted-foreground">
                Subjects assigned to you
              </p>
            </div>
          </div>

          {teacher.teacherSubjects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {teacher.teacherSubjects.map(({ subject }) => (
                <span
                  key={subject.id}
                  className="rounded-full border border-primary/15 bg-primary/5 px-3.5 py-2 text-sm font-medium text-primary"
                >
                  {subject.name}
                </span>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <BookOpen className="mx-auto mb-2 size-6 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                No subjects assigned yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
  href?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <div className="mt-2 flex min-w-0 items-center gap-2">
        {icon && (
          <span className="shrink-0 text-muted-foreground">
            {icon}
          </span>
        )}

        {value ? (
          href ? (
            <a
              href={href}
              className="truncate text-sm font-medium text-primary hover:underline"
            >
              {value}
            </a>
          ) : (
            <p className="truncate text-sm font-medium text-foreground">
              {value}
            </p>
          )
        ) : (
          <p className="text-sm font-medium text-muted-foreground">
            Not provided
          </p>
        )}
      </div>
    </div>
  );
}
