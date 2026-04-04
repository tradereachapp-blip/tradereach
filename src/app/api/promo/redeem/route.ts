import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { structuredError, logError, safeErrorMessage } from '@/lib/utils/error-logger'

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return structuredError('Unauthorized', 401)

    const body = await request.json()
    const { code } = body
    if (!code || typeof code !== 'string') {
      return structuredError('Promo code is required', 400)
    }

    const secret = process.env.PROMO_CODE_SECRET ?? 'chadthunderstick'
    const normalized = code.trim().toLowerCase()

    if (!timingSafeEqual(normalized, secret.toLowerCase())) {
      return Response.json({ success: false, error: 'Invalid promo code.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: contractor, error: lookupErr } = await admin
      .from('contractors')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (lookupErr || !contractor) {
      return structuredError('Contractor profile not found. Complete setup first.', 404)
    }

    // Check if already using a promo
    if (contractor.promo_expires_at && new Date(contractor.promo_expires_at) > new Date()) {
      const exp = new Date(contractor.promo_expires_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
      return Response.json({
        success: false,
        error: `Promo already active. Your Elite access expires ${exp}.`,
      }, { status: 400 })
    }

    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    const { error: updateErr } = await admin
      .from('contractors')
      .update({
        plan_type: 'elite',
        subscription_status: 'active',
        promo_code: normalized,
        promo_expires_at: expiresAt.toISOString(),
        onboarding_complete: true,
      })
      .eq('id', contractor.id)

    if (updateErr) {
      await logError('promo_redeem_update', updateErr.message)
      return structuredError('Failed to apply promo code. Try again.', 500)
    }

    return Response.json({
      success: true,
      message: 'Promo applied! You have Elite access for 1 year.',
      expires_at: expiresAt.toISOString(),
    })
  } catch (err) {
    await logError('promo_redeem', safeErrorMessage(err))
    return structuredError('Something went wrong', 500)
  }
}
