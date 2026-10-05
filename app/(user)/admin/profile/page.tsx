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
import { HorizontalDragScroll } from "./HorizontalDragScroll";

export default async function AdminProfilePage() {
  const user = await requireRole("ADMIN");

  return (
    <div className="mx-auto w-full max-w-5xl p-3 sm:p-6">
      <div className="space-y-5 sm:space-y-6">

        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
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
            className="w-fit shrink-0"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </ButtonShadcn>
        </div>

        {/* Profile Card */}
        <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">

          {/* Profile Header */}
          <div className="border-b bg-muted/30 p-4 sm:p-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm sm:h-20 sm:w-20">
                <User className="h-8 w-8 sm:h-9 sm:w-9" />
              </div>

              <div className="w-full min-w-0 text-center sm:text-left">
                <h2 className="text-xl font-semibold">
                  {user.name}
                </h2>

                <HorizontalDragScroll className="mt-1">
                  <p className="w-max min-w-full whitespace-nowrap text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </HorizontalDragScroll>

                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  Administrator
                </div>
              </div>

            </div>
          </div>

          {/* Account Information */}
          <div className="p-4 sm:p-8">
            <div className="mb-5">
              <h3 className="text-base font-semibold">
                Account Information
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Your current administrator account details.
              </p>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">

              {/* Name */}
              <div className="min-w-0 overflow-hidden rounded-lg border bg-background p-3.5 sm:p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Name
                    </p>

                    <HorizontalDragScroll className="mt-1">
                      <p className="w-max whitespace-nowrap text-sm font-medium">
                        {user.name}
                      </p>
                    </HorizontalDragScroll>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="min-w-0 overflow-hidden rounded-lg border bg-background p-3.5 sm:p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Email
                    </p>

                    <HorizontalDragScroll className="mt-1">
                      <p className="w-max whitespace-nowrap text-sm font-medium">
                        {user.email}
                      </p>
                    </HorizontalDragScroll>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="min-w-0 overflow-hidden rounded-lg border bg-background p-3.5 sm:p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Phone
                    </p>

                    <HorizontalDragScroll className="mt-1">
                      <p className="w-max whitespace-nowrap text-sm font-medium">
                        {user.phone || "Not provided"}
                      </p>
                    </HorizontalDragScroll>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="min-w-0 overflow-hidden rounded-lg border bg-background p-3.5 sm:p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Role
                    </p>

                    <HorizontalDragScroll className="mt-1">
                      <p className="w-max whitespace-nowrap text-sm font-medium">
                        {user.role}
                      </p>
                    </HorizontalDragScroll>
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