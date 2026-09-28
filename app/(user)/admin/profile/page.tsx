import Link from "next/link";
import {
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { ButtonShadcn } from "@/components/button";

export default async function AdminProfilePage() {
  const user = await requireRole("ADMIN");

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <div className="space-y-6">

        {/* Page Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              My Profile
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              View and manage your administrator account.
            </p>
          </div>

          <ButtonShadcn
            variant="outline"
            nativeButton={false}
            render={
              <Link href={`/admin/admins/${user.id}/edit`} />
            }
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </ButtonShadcn>
        </div>

        {/* Profile Card */}
        <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">

          {/* Profile Header */}
          <div className="border-b bg-muted/30 p-6 sm:p-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row">

              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <User className="h-9 w-9" />
              </div>

              <div className="text-center sm:text-left">
                <h2 className="text-xl font-semibold">
                  {user.name}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {user.email}
                </p>

                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Administrator
                </div>
              </div>

            </div>
          </div>

          {/* Account Information */}
          <div className="p-6 sm:p-8">
            <div className="mb-5">
              <h3 className="text-base font-semibold">
                Account Information
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Your current administrator account details.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              {/* Name */}
              <div className="rounded-lg border bg-background p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      Name
                    </p>

                    <p className="mt-1 truncate text-sm font-medium">
                      {user.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="rounded-lg border bg-background p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      Email
                    </p>

                    <p className="mt-1 truncate text-sm font-medium">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="rounded-lg border bg-background p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      Phone
                    </p>

                    <p className="mt-1 truncate text-sm font-medium">
                      {user.phone || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="rounded-lg border bg-background p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Role
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {user.role}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}