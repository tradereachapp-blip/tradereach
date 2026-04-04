import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { structuredError, logError, safeErrorMessage } from '@/lib/utils/error-logger'

// DELETE: Remove contractor account
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return structuredError('Unauthorized', 401)

    const admin = createAdminClient()
    const { data: contractor } = await admin
      .from('contractors').select('*').eq('user_id', user.id).single()

    if (contractor) {
      // Cancel Stripe subscription if active
      if (contractor.stripe_subscription_id) {
        try {
          await stripe.subscriptions.cancel(contractor.stripe_subscription_id)
        } catch (err) {
          // Log but continue with deletion
          await logError('stripe_cancel_on_delete', safeErrorMessage(err), { contractor_id: contractor.id })
        }
      }

      // Delete contractor record (cascade will handle related records)
      await admin.from('contractors').delete().eq('id', contractor.id)
    }

    // Delete auth user
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) {
      await logError('auth_delete_failed', deleteError.message, { user_id: user.id })
      return structuredError('Failed to delete account. Please contact support.', 500)
    }

    return Response.json({ success: true })
  } catch (err) {
    await logError('account_delete_error', safeErrorMessage(err))
    return structuredError('Failed to delete account', 500)
  }
}
