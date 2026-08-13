import { requireRole, type UserRole } from '@/lib/auth/require-role'

export default async function AuthVerify(...roles: UserRole[]) {
  const allowedRoles: UserRole[] = roles.length
    ? roles
    : ["ADMIN", "TEACHER", "STUDENT"]
  return requireRole(...allowedRoles)
}
