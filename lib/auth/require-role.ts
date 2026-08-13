import { redirect } from "next/navigation";

import { getCurrentUser } from "./session";

export type UserRole =
  | "ADMIN"
  | "TEACHER"
  | "STUDENT";

/**
 * Normal authentication/authorization boundary
 * for Server Components, layouts, pages, etc.
 *
 * Does NOT mutate cookies.
 * Does NOT redirect.
 *
 * Usage:
 *   export default async function AdminLayout() {
 *     const user = await requireRole("ADMIN");
 *     return <AdminContent user={user} />;
 *   }
 */
export async function requireRole(
  ...allowedRoles: UserRole[]
) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!allowedRoles.includes(user.role)) {
    redirect(homeForRole(user.role));
  }

  return user;
}

/**
 * Authentication boundary specifically for Server Actions.
 *
 * This is the ONLY place Server Actions perform authentication/authorization.
 *
 * There is NO token refresh.
 *
 * If the authentication token has expired:
 *   The action fails to authenticate.
 *   The mutation does NOT execute.
 *   The browser must redirect to /login.
 *
 * Usage:
 *   async function createStudent(formData: FormData) {
 *     "use server";
 *     const admin = await requireRoleForAction("ADMIN");
 *     // Now safe to execute mutation
 *     await prisma.student.create({...});
 *   }
 */
export async function requireRoleForAction(
  ...allowedRoles: UserRole[]
) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!allowedRoles.includes(user.role)) {
    redirect(homeForRole(user.role));
  }

  return user;
}

// ---------------------------------------------------------
// ROLE HOME
// ---------------------------------------------------------

/**
 * Determine the default home route for a given role.
 */
export function homeForRole(
  role: UserRole
) {
  switch (role) {
    case "ADMIN":
      return "/Admin";

    case "TEACHER":
      return "/Teacher";

    case "STUDENT":
      return "/Student";
  }
}
