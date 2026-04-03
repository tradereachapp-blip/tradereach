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
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-red-500 text-lg">🚨</span>
          <div>
            <p className="font-semibold text-red-900">Payment Past Due</p>
            <p className="text-red-700 text-sm">
              Update your billing info to keep receiving leads.{' '}
              <a href="/settings" className="underline font-medium">Fix now →</a>
            </p>
          </div>
        </div>
      )}

      {isExpiringSoon && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-amber-500 text-lg">⏳</span>
          <div>
            <p className="font-semibold text-amber-900">Free Trial Active</p>
            <p className="text-amber-700 text-sm">
              Your trial will convert to a paid plan soon. Make sure your billing is set up.{' '}
              <a href="/settings" className="underline font-medium">Manage →</a>
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Plan</p>
            <p className="font-bold text-gray-900 capitalize">
              {contractor.plan_type === 'pay_per_lead' ? 'Pay Per Lead' : contractor.plan_type}
            </p>
          </div>

          {contractor.plan_type === 'pro' && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Leads This Month</p>
              <p className="font-bold text-gray-900">
                <span className={contractor.leads_used_this_month >= PRO_MONTHLY_LEAD_CAP ? 'text-red-600' : 'text-green-600'}>
                  {contractor.leads_used_this_month}
                </span>
                <span className="text-gray-400"> / {PRO_MONTHLY_LEAD_CAP}</span>
              </p>
            </div>
          )}

          {contractor.plan_type === 'elite' && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Monthly Leads</p>
              <p className="font-bold text-green-600">Unlimited</p>
            </div>
          )}

          {contractor.plan_type === 'pay_per_lead' && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Lead Cost</p>
              <p className="font-bold text-gray-900">$45 / lead</p>
            </div>
          )}

          {nextReset && contractor.plan_type === 'pro' && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Resets On</p>
              <p className="font-bold text-gray-900">{nextReset.toLocaleDateString()}</p>
            </div>
          )}
        </div>

        <a
          href="/settings"
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Manage Plan →
        </a>
      </div>
    </div>
  )
}
