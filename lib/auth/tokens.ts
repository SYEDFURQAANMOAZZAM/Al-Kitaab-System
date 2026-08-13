import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "crypto";

type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

const ISSUER = "alkitaab";
const ACCESS_AUDIENCE = "alkitaab-access";
const REFRESH_AUDIENCE = "alkitaab-refresh";

function signingSecret(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} must be configured`);
  }

  return new TextEncoder().encode(value);
}


export async function signAccessToken(userId: string, role: UserRole) {
  return new SignJWT({ userId, role, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(ACCESS_AUDIENCE)
    .setExpirationTime("15m")
    .setIssuedAt()
    .sign(signingSecret("JWT_ACCESS_SECRET"));
}

export async function signRefreshToken(userId: string, role: UserRole) {
  return new SignJWT({ userId, role, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(REFRESH_AUDIENCE)
    .setExpirationTime("7d")
    .setIssuedAt()
    .setJti(randomUUID())
    .sign(signingSecret("JWT_REFRESH_SECRET"));
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, signingSecret("JWT_ACCESS_SECRET"), {
    algorithms: ["HS256"],
    issuer: ISSUER,
    audience: ACCESS_AUDIENCE,
  });

  if (!hasBaseClaims(payload) || payload.type !== "access") {
    throw new Error("Invalid access token");
  }

  return { userId: payload.userId, role: payload.role };
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, signingSecret("JWT_REFRESH_SECRET"), {
    algorithms: ["HS256"],
    issuer: ISSUER,
    audience: REFRESH_AUDIENCE,
  });

  if (!hasBaseClaims(payload) || payload.type !== "refresh" || typeof payload.jti !== "string") {
    throw new Error("Invalid refresh token");
  }

  return { userId: payload.userId, role: payload.role, jti: payload.jti };
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
