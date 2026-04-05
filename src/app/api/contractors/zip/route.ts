import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logError, safeErrorMessage, structuredError } from '@/lib/utils/error-logger'
import { getZipStatus } from '@/lib/utils/zip-status'
import { recordZipClaim, releaseZipClaim } from '@/lib/utils/zip-claims'
import { PLAN_CONFIG } from '@/lib/config'
import type { Niche } from '@/types'

// GET /api/contractors/zip?zip=90210&niche=Roofing — check status before adding
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return structuredError('Unauthorized', 401)

    const url = new URL(request.url)
    const zip = url.searchParams.get('zip')
    const niche = url.searchParams.get('niche') as Niche

    if (!zip || !niche) return structuredError('zip and niche required', 400)
    if (!/^\d{5}$/.test(zip)) return structuredError('Invalid ZIP code format', 400)

    const admin = createAdminClient()
    const { data: contractor } = await admin
      .from('contractors').select('id, plan_type, zip_codes, niche').eq('user_id', user.id).single()
    if (!contractor) return structuredError('Contractor not found', 404)

    // Check if already added
    const alreadyAdded = (contractor.zip_codes ?? []).includes(zip)

    const status = await getZipStatus(zip, niche || contractor.niche, contractor.id, contractor.plan_type)

    return Response.json({ status, alreadyAdded })
  } catch (err) {
    await logError('zip_status_check_error', safeErrorMessage(err))
    return structuredError('Failed to check ZIP status', 500)
  }
}

// POST /api/contractors/zip — add a ZIP
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return structuredError('Unauthorized', 401)

    const body = await request.json()
    const { zip, confirmed } = body

    if (!zip || !/^\d{5}$/.test(zip)) return structuredError('Invalid ZIP code', 400)

    const admin = createAdminClient()
    const { data: contractor } = await admin
      .from('contractors').select('*').eq('user_id', user.id).single()
    if (!contractor) return structuredError('Contractor not found', 404)

    const planConfig = PLAN_CONFIG[contractor.plan_type as keyof typeof PLAN_CONFIG]
    const maxZips = planConfig?.maxZipCodes

    // Check ZIP limit
    const currentZips = contractor.zip_codes ?? []
    if (maxZips !== 'unlimited' && currentZips.length >= (maxZips as number)) {
      return Response.json({
        success: false,
        error: `Your ${planConfig?.label} plan allows up to ${maxZips} ZIP codes. Upgrade to add more.`,
        at_limit: true,
      }, { status: 403 })
    }

    if (currentZips.includes(zip)) {
      return Response.json({ success: false, error: 'ZIP already in your service area' }, { status: 400 })
    }

    // Get ZIP status
    const status = await getZipStatus(zip, contractor.niche, contractor.id, contractor.plan_type)

    if (!status.canAdd) {
      return Response.json({
        success: false,
        error: status.description,
        status: status.status,
        upgrade_suggestion: status.upgradeSuggestion,
      }, { status: 403 })
    }

    // If not confirmed, return status for user to confirm
    if (!confirmed) {
      return Response.json({
        success: false,
        requires_confirmation: true,
        status,
        zip,
        message: status.description,
      })
    }

    // Record the claim
    const result = await recordZipClaim(
      contractor.id,
      zip,
      contractor.niche,
      status.claimType!,
      contractor.plan_type
    )

    if (!result.success) {
      return Response.json({ success: false, error: result.error }, { status: 500 })
    }

    return Response.json({ success: true, zip, claim_type: status.claimType, status })
  } catch (err) {
    await logError('zip_add_error', safeErrorMessage(err))
    return structuredError('Failed to add ZIP', 500)
  }
}

// DELETE /api/contractors/zip — remove a ZIP
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return structuredError('Unauthorized', 401)

    const body = await request.json()
    const { zip } = body
    if (!zip) return structuredError('zip required', 400)

    const admin = createAdminClient()
    const { data: contractor } = await admin
      .from('contractors').select('*').eq('user_id', user.id).single()
    if (!contractor) return structuredError('Contractor not found', 404)

    const currentZips = contractor.zip_codes ?? []
    if (!currentZips.includes(zip)) {
      return Response.json({ success: false, error: 'ZIP not in your service area' }, { status: 400 })
    }

    // Release the claim
    await releaseZipClaim(contractor.id, zip, contractor.niche)

    // Remove from zip_codes
    await admin.from('contractors').update({
      zip_codes: currentZips.filter((z: string) => z !== zip),
    }).eq('id', contractor.id)

    return Response.json({ success: true, zip })
  } catch (err) {
    await logError('zip_remove_error', safeErrorMessage(err))
    return structuredError('Failed to remove ZIP', 500)
  }
}
