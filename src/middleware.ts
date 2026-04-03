import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that require an authenticated session
const PROTECTED_ROUTES = ['/dashboard', '/onboarding', '/settings']
// Routes that should redirect to dashboard if already logged in
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password']
// Admin route
const ADMIN_ROUTE = '/admin'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin panel — check ADMIN_PASSWORD via query param or header
  if (pathname.startsWith(ADMIN_ROUTE)) {
    const adminPassword = process.env.ADMIN_PASSWORD
    const provided =
      request.nextUrl.searchParams.get('admin_key') ||
      request.headers.get('x-admin-key')

    if (!provided || provided !== adminPassword) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  const { response, user } = await updateSession(request)

  // Protect dashboard routes
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect authenticated users away from auth pages
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
