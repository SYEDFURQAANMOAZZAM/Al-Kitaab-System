'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { signAccessToken, signRefreshToken } from '@/lib/auth/tokens'
import { hashRefreshToken } from '@/lib/auth/token-hash'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
export async function login(prevState: { error?: string } | undefined,
  formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return { error: 'Invalid credentials' }
  }
  
  const valid = await bcrypt.compare(password, user.password)
  

  if (!valid) return { error: 'Invalid credentials' }
  

  const accessToken = await signAccessToken(user.id, user.role)
  const refreshToken = await signRefreshToken(user.id, user.role)
  
  // Store refresh token in DB for rotation tracking
  await prisma.session.create({
    data: {
      tokenHash: hashRefreshToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })
  const cookieStore =await cookies()
  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  })
  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })
  if (user.isaccess !== 'YES') redirect('/NotAccess')
  redirect(user.role === 'ADMIN' ? '/Admin' : user.role === 'TEACHER' ? '/Teacher' : '/Student')
}
export async function logout() {
  const cookieStore =await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  if (refreshToken) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashRefreshToken(refreshToken) },
    })
  }
  cookieStore.set('access_token', '', { maxAge: 0, path: '/' })
  cookieStore.set('refresh_token', '', { maxAge: 0, path: '/' })
  redirect('/login')
}
