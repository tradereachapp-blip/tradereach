import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { structuredError, logError, safeErrorMessage } from '@/lib/utils/error-logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return structuredError('Unauthorized', 401)

    const admin = createAdminClient()
    const { data: contractor } = await admin
      .from('contractors').select('id').eq('user_id', user.id).single()
    if (!contractor) return structuredError('Contractor not found', 404)

    // Get all claimed leads with claim data
    const { data: claims } = await admin
      .from('lead_claims')
      .select(`
        claimed_at,
        payment_type,
        amount_charged,
        leads (
          id, name, phone, zip, niche, description, callback_time, created_at
        )
      `)
      .eq('contractor_id', contractor.id)
      .order('claimed_at', { ascending: false })

    if (!claims) return structuredError('Failed to fetch leads', 500)

    // Build CSV
    const headers = ['Lead ID', 'Name', 'Phone', 'ZIP', 'Niche', 'Description', 'Best Time to Call', 'Submitted', 'Claimed', 'Payment Type', 'Amount Charged']
    const rows = claims.map((claim) => {
      const lead = claim.leads as any
      return [
        lead?.id ?? '',
        lead?.name ?? '',
        lead?.phone ?? '',
        lead?.zip ?? '',
        lead?.niche ?? '',
        (lead?.description ?? '').replace(/,/g, ';'),
        lead?.callback_time ?? '',
        lead?.created_at ? new Date(lead.created_at).toLocaleDateString() : '',
        claim.claimed_at ? new Date(claim.claimed_at).toLocaleDateString() : '',
        claim.payment_type,
        claim.amount_charged != null ? `$${claim.amount_charged}` : '$0',
      ]
    })

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="tradereach-leads-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (err) {
    await logError('leads_export_error', safeErrorMessage(err))
    return structuredError('Export failed', 500)
  }
}
