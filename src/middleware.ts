import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that require an authenticated session
const PROTECTED_ROUTES = ['/dashboard', '/onboarding', '/settings']
// Routes that should redirect to dashboard if already logged in
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password']
// Admin route prefix
const ADMIN_ROUTE = '/admin'

// ── Security headers applied to every response ──────────────────────────────
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  // Stop MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  // Force HTTPS for 1 year, include subdomains
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  // Never leak full URL to third parties
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // Lock down browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()'
  )
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://api.resend.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ')
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Admin panel — header-only auth (query params leak in server logs & referrers) ──
  if (pathname.startsWith(ADMIN_ROUTE) && !pathname.startsWith('/admin/login')) {
    const adminPassword = process.env.ADMIN_PASSWORD
    const provided = request.headers.get('x-admin-key')
    if (!provided || provided !== adminPassword) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  const { response, user } = await updateSession(request)
  const secured = addSecurityHeaders(response)

  // ── Protect dashboard routes ─────────────────────────────────────────────
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return addSecurityHeaders(NextResponse.redirect(loginUrl))
    }
  }

  // ── Redirect authenticated users away from auth pages ────────────────────
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    if (user) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)))
    }
  }

  return secured
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
