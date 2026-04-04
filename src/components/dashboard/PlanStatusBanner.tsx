import type { Contractor } from '@/types'
import { PRO_MONTHLY_LEAD_CAP } from '@/lib/config'

interface Props {
  contractor: Contractor
}

export default function PlanStatusBanner({ contractor }: Props) {
  if (contractor.plan_type === 'none') return null

  const isExpiringSoon = contractor.subscription_status === 'trialing'
  const isPastDue = contractor.subscription_status === 'past_due'

  const resetDate = contractor.leads_reset_at
    ? new Date(contractor.leads_reset_at)
    : null
  const nextReset = resetDate
    ? new Date(resetDate.getFullYear(), resetDate.getMonth() + 1, resetDate.getDate())
    : null

  return (
    <div className="mb-6 space-y-3">
      {isPastDue && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <span className="text-red-400 text-lg">🚨</span>
          <div>
            <p className="font-semibold text-red-300">Payment Past Due</p>
            <p className="text-red-400/80 text-sm">
              Update your billing info to keep receiving leads.{' '}
              <a href="/settings" className="underline font-medium text-red-300">Fix now →</a>
            </p>
          </div>
        </div>
      )}

      {isExpiringSoon && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <span className="text-amber-400 text-lg">⏳</span>
          <div>
            <p className="font-semibold text-amber-300">Free Trial Active</p>
            <p className="text-amber-400/80 text-sm">
              Your trial will convert to a paid plan soon. Make sure your billing is set up.{' '}
              <a href="/settings" className="underline font-medium text-amber-300">Manage →</a>
            </p>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-white/8 rounded-xl p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">Plan</p>
            <p className="font-bold text-white capitalize">
              {contractor.plan_type === 'pay_per_lead' ? 'Pay Per Lead' : contractor.plan_type}
            </p>
          </div>

          {contractor.plan_type === 'pro' && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">Leads This Month</p>
              <p className="font-bold">
                <span className={contractor.leads_used_this_month >= PRO_MONTHLY_LEAD_CAP ? 'text-red-400' : 'text-green-400'}>
                  {contractor.leads_used_this_month}
                </span>
                <span className="text-gray-600"> / {PRO_MONTHLY_LEAD_CAP}</span>
              </p>
            </div>
          )}

          {contractor.plan_type === 'elite' && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">Monthly Leads</p>
              <p className="font-bold text-green-400">Unlimited</p>
            </div>
          )}

          {contractor.plan_type === 'pay_per_lead' && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">Lead Cost</p>
              <p className="font-bold text-white">$45 / lead</p>
            </div>
          )}

          {nextReset && contractor.plan_type === 'pro' && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">Resets On</p>
              <p className="font-bold text-white">{nextReset.toLocaleDateString()}</p>
            </div>
          )}
        </div>

        <a
          href="/settings"
          className="text-sm text-orange-400 hover:text-orange-300 font-medium transition-colors"
        >
          Manage Plan →
        </a>
      </div>
    </div>
  )
}
