import { SignJWT, jwtVerify } from 'jose'
import { randomUUID } from 'crypto'

type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT'

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!)
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!)


export async function signAccessToken(userId: string, role: UserRole) {
  return new SignJWT({ userId, role, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .setIssuedAt()
    .sign(ACCESS_SECRET)
}

export async function signRefreshToken(userId: string, role: UserRole) {
  return new SignJWT({ userId, role, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .setJti(randomUUID())
    .sign(REFRESH_SECRET)
}
export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, ACCESS_SECRET)
  if (payload.type !== 'access' || typeof payload.userId !== 'string' || !isUserRole(payload.role)) {
    throw new Error('Invalid access token')
  }
  return payload as { userId: string; role: UserRole; type: string }
}
export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, REFRESH_SECRET)
  if (payload.type !== 'refresh' || typeof payload.userId !== 'string' || !isUserRole(payload.role)) {
    throw new Error('Invalid refresh token')
  }
  return payload as { userId: string; role: UserRole; type: string }
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'ADMIN' || value === 'TEACHER' || value === 'STUDENT'
}
