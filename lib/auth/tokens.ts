import { SignJWT, jwtVerify } from "jose";

type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

const ISSUER = "alkitaab";
const AUDIENCE = "alkitaab-app";

function signingSecret() {
  const value = process.env.JWT_SECRET;

  if (!value) {
    throw new Error("JWT_SECRET must be configured");
  }

  return new TextEncoder().encode(value);
}

/**
 * Sign a single authentication token.
 *
 * This token authenticates the user and contains their role for efficient
 * route-level screening. However, the database remains the source of truth
 * for authorization in Server Actions and sensitive operations.
 *
 * Expires in 30 minutes.
 */
export async function signAuthToken(userId: string, role: UserRole) {
  return new SignJWT({ userId, role, type: "auth" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime("24h")
    .setIssuedAt()
    .sign(signingSecret());
}

/**
 * Verify an authentication token.
 *
 * Validates:
 * - Signature with JWT_SECRET
 * - Expected algorithm (HS256)
 * - Issuer
 * - Audience
 * - Token type
 * - Expiration
 * - Base claims (userId, role, iat, exp)
 *
 * Returns the verified userId and role.
 *
 * Throws if token is invalid, expired, or tampered with.
 */
export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, signingSecret(), {
    algorithms: ["HS256"],
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  if (!hasBaseClaims(payload) || payload.type !== "auth") {
    throw new Error("Invalid authentication token");
  }

  return { userId: payload.userId, role: payload.role };
}

function isUserRole(value: unknown): value is UserRole {
  return value === "ADMIN" || value === "TEACHER" || value === "STUDENT";
}

function hasBaseClaims(payload: Record<string, unknown>): payload is Record<string, unknown> & {
  userId: string;
  role: UserRole;
  iat: number;
  exp: number;
} {
  return typeof payload.userId === "string" && isUserRole(payload.role) &&
    typeof payload.iat === "number" && typeof payload.exp === "number";
}
