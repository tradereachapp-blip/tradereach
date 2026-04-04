// ─── Auth Callback Route ─────────────────────────────────────────────────────
// Handles Supabase email confirmation + OAuth redirects.
// Supabase sends users here after they click the confirmation link in their email.
// URL format: /auth/callback?code=...&next=/dashboard
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Use production URL to avoid localhost redirects
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successful auth — redirect to dashboard (or wherever next points)
      return NextResponse.redirect(`${siteUrl}${next}`)
    }

    console.error('Auth callback error:', error.message)
  }

  // Auth failed — redirect to login with error
  return NextResponse.redirect(`${siteUrl}/login?error=auth_callback_failed`)
}
