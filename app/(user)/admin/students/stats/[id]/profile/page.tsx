import Link from "next/link";
import { ArrowLeft, Edit, Mail, MapPin, Phone, User } from "lucide-react";

import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";
import { ButtonShadcn } from "@/components/button";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudentProfilePage({
  params,
}: Props) {
  await AuthVerify("ADMIN");

  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      fatherName: true,
      Adress: true,

      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          phone2: true,
        },
      },

      enrollments: {
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
      },

      studentSubjects: {
        select: {
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <User className="size-5 text-muted-foreground" />
        </div>

        <h1 className="text-xl font-semibold">
          Student not found
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          The student may have been deleted or does not exist.
        </p>

        <Link
          href="/admin/students/stats"
          className="mt-5"
        >
          <ButtonShadcn variant="outline">
            <ArrowLeft className="mr-2 size-4" />
            Back to Students
          </ButtonShadcn>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/students/stats">
            <ButtonShadcn
              variant="ghost"
              size="icon"
              className="shrink-0"
            >
              <ArrowLeft className="size-4" />
            </ButtonShadcn>
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Student Profile
            </h1>

            <p className="text-muted-foreground">
              View student information
            </p>
          </div>
        </div>

        <Link
          href={`/admin/students/stats/${student.id}/edit`}
        >
          <ButtonShadcn className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Edit className="mr-2 size-4" />
            Edit Student
          </ButtonShadcn>
        </Link>
      </div>

      {/* Profile */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Student Overview */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
              {student.user.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              {student.user.name}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Student
            </p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-5 text-lg font-semibold">
            Personal Information
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <InfoItem
              label="Full Name"
              value={student.user.name}
            />

            <InfoItem
              label="Father Name"
              value={student.fatherName}
            />

            <InfoItem
              label="Email"
              value={student.user.email}
              icon={<Mail className="size-4" />}
            />

            <InfoItem
            label="Phone"
            value={student.user.phone}
            href={
                student.user.phone
                ? `tel:${student.user.phone}`
                : undefined
            }
            icon={<Phone className="size-4" />}
            />

            <InfoItem
            label="Alternate Phone"
            value={student.user.phone2}
            href={
                student.user.phone2
                ? `tel:${student.user.phone2}`
                : undefined
            }
            icon={<Phone className="size-4" />}
            />

            <InfoItem
              label="Address"
              value={student.Adress}
              icon={<MapPin className="size-4" />}
            />
          </div>
        </div>

        {/* Batches */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Batches
          </h2>

          {student.enrollments.length > 0 ? (
            <div className="space-y-3">
              {student.enrollments.map(
                ({ batch }) => (
                  <div
                    key={batch.id}
                    className="rounded-xl border bg-muted/30 p-3"
                  >
                    <p className="font-medium">
                      {batch.name}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {batch.branch.name}
                    </p>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No batches assigned.
            </p>
          )}
        </div>

        {/* Subjects */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">
            Subjects
          </h2>

          {student.studentSubjects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {student.studentSubjects.map(
                ({ subject }) => (
                  <span
                    key={subject.id}
                    className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                  >
                    {subject.name}
                  </span>
                )
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No subjects assigned.
            </p>
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
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <div className="mt-1 flex items-center gap-2">
        {icon && (
          <span className="text-muted-foreground">
            {icon}
          </span>
        )}

        {value ? (
          href ? (
            <a
              href={href}
              className="text-sm font-medium text-primary hover:underline"
            >
              {value}
            </a>
          ) : (
            <p className="text-sm font-medium text-foreground">
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