import { cookies } from 'next/headers'
import { verifyAccessToken } from './tokens'
import { cache } from 'react'
import { prisma } from '../prisma'

// `cache` deduplicates calls within one request
export const getCurrentUser = cache(async () => {
  const cookieStore=await cookies();
  const token =cookieStore.get('access_token')?.value
  if (!token) return null
  try {
    const { userId } = await verifyAccessToken(token)
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true ,isaccess:true}
    })
  } catch {
    return null
  }
})