
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import {
  Mail,
  Phone,
  ContactRound,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

export default async function TeacherContactsPage() {
  await requireRole("TEACHER");

  const admins = await prisma.user.findMany({
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
  });

  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl space-y-6">
      {/* Page Header */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ContactRound className="h-4 w-4" />
          <span>Teacher Portal</span>
          <span>/</span>
          <span className="text-foreground">Contacts</span>
        </div>

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Admin Contacts
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Contact the administration for academic, attendance,
              or institute-related assistance.
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>
              {admins.length} {admins.length === 1 ? "Admin" : "Admins"}
            </span>
          </div>
        </div>
      </section>

      {/* Admin Contact Cards */}
      {admins.length === 0 ? (
        <section className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-5 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <ContactRound className="h-7 w-7 text-muted-foreground" />
          </div>

          <h2 className="text-lg font-semibold">No admin contacts found</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Admin contact details will appear here once an admin
            account has been created.
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {admins.map((admin) => {
            const initials = admin.name
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase();

            const phones = [admin.phone, admin.phone2].filter(
              (phone): phone is string => Boolean(phone?.trim())
            );

            return (
              <article
                key={admin.id}
                className="group flex min-w-0 flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                {/* Admin Identity */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                    {initials || "A"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold">
                      {admin.name}
                    </h2>

                    <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      <ShieldCheck className="h-3 w-3" />
                      Administrator
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="mt-5 space-y-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 rounded-md bg-muted p-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <a
                        href={`mailto:${admin.email}`}
                        className="break-all text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                      >
                        {admin.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 rounded-md bg-muted p-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Phone</p>

                      {phones.length > 0 ? (
                        <div className="space-y-1">
                          {phones.map((phone, index) => (
                            <a
                              key={`${phone}-${index}`}
                              href={`tel:${phone}`}
                              className="block text-sm font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {phone}
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

                {/* Actions */}
                <div className="mt-5 flex gap-2 border-t pt-4">
                  <Link
                    href={`mailto:${admin.email}`}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>

                  {phones[0] ? (
                    <Link
                      href={`tel:${phones[0]}`}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      No phone
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
