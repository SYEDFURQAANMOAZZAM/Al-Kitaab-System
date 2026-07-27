import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/tokens'



const PROTECTED_ROUTES = ['/Admin', '/Teacher', '/Student']
const AUTH_ROUTES = ['/login', '/register']
const ROUTE_ROLES = {
  '/Admin': 'ADMIN',
  '/Teacher': 'TEACHER',
  '/Student': 'STUDENT',
} as const

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProtected = PROTECTED_ROUTES.some(route => matchesRoute(path, route))
  const isAuthRoute = AUTH_ROUTES.some(route => matchesRoute(path, route))
  const accessToken = request.cookies.get('access_token')?.value
  if (isProtected) {
    if (!accessToken) {
     
      return redirectToRefresh(request)
    }
    try {
      const { role } = await verifyAccessToken(accessToken)
      const requiredRole = Object.entries(ROUTE_ROLES).find(([route]) => matchesRoute(path, route))?.[1]
      if (requiredRole && role !== requiredRole) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      return NextResponse.next()
    } catch {
      // Token expired or invalid — redirect to refresh or login
      return redirectToRefresh(request)
    }
  }
  if (isAuthRoute && accessToken) {
    try {
      const { role } = await verifyAccessToken(accessToken)
      return NextResponse.redirect(new URL(homeForRole(role), request.url))
    } catch {
      // Expired token on auth page — let them log in again
    }
  }
  return NextResponse.next()
}

function redirectToRefresh(request: NextRequest) {
  const refreshUrl = new URL('/api/auth/refresh', request.url)
  refreshUrl.searchParams.set('redirectTo', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(refreshUrl)
}

function homeForRole(role: 'ADMIN' | 'TEACHER' | 'STUDENT') {
  return role === 'ADMIN' ? '/Admin' : role === 'TEACHER' ? '/Teacher' : '/Student'
}

function matchesRoute(path: string, route: string) {
  return path === route || path.startsWith(`${route}/`)
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
