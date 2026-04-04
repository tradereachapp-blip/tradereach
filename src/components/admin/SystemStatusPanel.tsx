'use client'

import { useEffect, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ServiceStatus {
  service_name: string
  status: 'operational' | 'degraded' | 'down'
  response_time_ms: number | null
  error_message: string | null
  checked_at: string
  uptime_24h: number
  uptime_7d: number
  uptime_30d: number
}

interface IncidentRecord {
  service_name: string
  status: string
  checked_at: string
  error_message: string | null
  recovered_at: string | null
}

interface StatusData {
  services: ServiceStatus[]
  incidents: IncidentRecord[]
  twilioBalance: string | null
  allGreen: boolean
  lastUpdated: string
}

const SERVICE_LABELS: Record<string, string> = {
  database: 'Database',
  lead_form: 'Lead Form',
  notification_system: 'Notification System',
  stripe_webhook: 'Stripe Webhook',
  twilio_sms: 'Twilio SMS',
  resend_email: 'Resend Email',
  auth: 'Authentication',
  admin_panel: 'Admin Panel',
}

const SERVICE_ICONS: Record<string, string> = {
  database: '🗄️',
  lead_form: '📝',
  notification_system: '🔔',
  stripe_webhook: '💳',
  twilio_sms: '📱',
  resend_email: '📧',
  auth: '🔐',
  admin_panel: '⚙️',
}

function StatusDot({ status }: { status: 'operational' | 'degraded' | 'down' | 'unknown' }) {
  const colors = {
    operational: 'bg-green-400',
    degraded: 'bg-yellow-400',
    down: 'bg-red-500',
    unknown: 'bg-gray-600',
  }
  const pulses = {
    operational: '',
    degraded: 'animate-pulse',
    down: 'animate-pulse',
    unknown: '',
  }
  return (
    <span className="relative flex items-center justify-center w-3 h-3">
      <span className={`absolute inline-flex h-full w-full rounded-full opacity-50 ${colors[status]} ${pulses[status]}`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[status]}`} />
    </span>
  )
}

function UptimeBadge({ pct }: { pct: number }) {
  const color = pct >= 99 ? 'text-green-400' : pct >= 95 ? 'text-yellow-400' : 'text-red-400'
  return <span className={`text-xs font-mono font-bold ${color}`}>{pct.toFixed(1)}%</span>
}

// ── Rex Animation Component ───────────────────────────────────────────────────
function RexMonitor({ allGreen, downServices }: { allGreen: boolean; downServices: string[] }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 300) }, [])

  if (!visible) return null

  if (allGreen) {
    return (
      <div className="flex items-center gap-4 bg-green-500/8 border border-green-500/20 rounded-2xl p-4 mb-6">
        <div style={{ animation: 'rexFloatSm 3s ease-in-out infinite', flexShrink: 0 }}>
          <img src="/images/rex-avatar.png" alt="Rex" style={{ height: 56, width: 'auto', objectFit: 'contain' }} />
        </div>
        <div>
          <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-0.5">Rex says</div>
          <p className="text-sm text-green-300 font-medium">All systems running smoothly. 👍 Nothing to worry about.</p>
        </div>
        <style>{`@keyframes rexFloatSm{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
      <div style={{ animation: 'rexPulseRed 0.5s ease-in-out infinite', flexShrink: 0 }}>
        <img src="/images/rex-avatar.png" alt="Rex" style={{ height: 56, width: 'auto', objectFit: 'contain' }} />
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-0.5">⚠️ Rex Alert</div>
        <p className="text-sm text-red-300 font-semibold">
          {downServices.map(s => SERVICE_LABELS[s] ?? s).join(', ')} {downServices.length === 1 ? 'is' : 'are'} down. Check the System Status panel immediately.
        </p>
      </div>
      <style>{`@keyframes rexPulseRed{0%,100%{filter:drop-shadow(0 0 0 rgba(239,68,68,0))}50%{filter:drop-shadow(0 0 8px rgba(239,68,68,0.8))}}`}</style>
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export default function SystemStatusPanel() {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedIncidents, setExpandedIncidents] = useState(false)

  useEffect(() => {
    fetch('/api/admin/system-status')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/admin/system-status')
        .then(r => r.json())
        .then(d => setData(d))
        .catch(() => {})
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-48 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-gray-800 rounded-lg" />)}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-sm text-red-400">
        ⚠️ Could not load system status. Run the first monitoring check to initialize.
      </div>
    )
  }

  const downServices = data.services.filter(s => s.status === 'down').map(s => s.service_name)
  const recentIncidents = data.incidents.slice(0, expandedIncidents ? undefined : 5)
  const lastCheck = data.services[0]?.checked_at
    ? new Date(data.services[0].checked_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Los_Angeles' })
    : 'Never'

  return (
    <div className="mb-8">
      {/* Rex Status */}
      <RexMonitor allGreen={data.allGreen} downServices={downServices} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">System Status</h2>
        <div className="text-xs text-gray-600">Last check: {lastCheck} PT · Auto-refreshes every 5 min</div>
      </div>

      {/* Service Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {data.services.map(svc => (
          <div
            key={svc.service_name}
            className={`bg-gray-900 border rounded-xl p-3 transition-all ${
              svc.status === 'operational'
                ? 'border-gray-800 hover:border-green-500/30'
                : svc.status === 'degraded'
                ? 'border-yellow-500/40 bg-yellow-500/5'
                : 'border-red-500/40 bg-red-500/5'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{SERVICE_ICONS[svc.service_name] ?? '🔧'}</span>
              <StatusDot status={svc.status} />
            </div>
            <div className="text-xs font-semibold text-white mb-1 leading-tight">
              {SERVICE_LABELS[svc.service_name] ?? svc.service_name}
            </div>
            <div className={`text-[10px] font-bold mb-1 ${
              svc.status === 'operational' ? 'text-green-400'
              : svc.status === 'degraded' ? 'text-yellow-400'
              : 'text-red-400'
            }`}>
              {svc.status.toUpperCase()}
            </div>
            {svc.response_time_ms !== null && (
              <div className="text-[10px] text-gray-600">{svc.response_time_ms}ms</div>
            )}
            {svc.error_message && (
              <div className="text-[10px] text-red-400 mt-1 leading-tight truncate" title={svc.error_message}>
                {svc.error_message.slice(0, 40)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Uptime Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Uptime</span>
          <div className="flex gap-4 text-[10px] text-gray-600 font-medium">
            <span>24H</span><span>7D</span><span>30D</span>
          </div>
        </div>
        {data.services.map(svc => (
          <div key={svc.service_name} className="flex items-center px-4 py-2 border-b border-gray-800/50 last:border-0">
            <span className="flex-1 text-xs text-gray-400">{SERVICE_LABELS[svc.service_name] ?? svc.service_name}</span>
            <div className="flex gap-4 text-right">
              <UptimeBadge pct={svc.uptime_24h} />
              <UptimeBadge pct={svc.uptime_7d} />
              <UptimeBadge pct={svc.uptime_30d} />
            </div>
          </div>
        ))}
      </div>

      {/* Twilio Balance */}
      {data.twilioBalance && (
        <div className={`border rounded-xl px-4 py-3 mb-6 flex items-center justify-between ${
          parseFloat(data.twilioBalance.replace(/[^0-9.]/g, '')) < 5
            ? 'border-yellow-500/30 bg-yellow-500/5'
            : 'border-gray-800 bg-gray-900'
        }`}>
          <span className="text-sm text-gray-400">📱 Twilio SMS Balance</span>
          <span className={`text-sm font-bold ${
            parseFloat(data.twilioBalance.replace(/[^0-9.]/g, '')) < 5 ? 'text-yellow-400' : 'text-white'
          }`}>{data.twilioBalance}</span>
        </div>
      )}

      {/* Incident History */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <span className="text-sm font-semibold text-white">Incident History</span>
          <span className="text-xs text-gray-600 ml-2">(last 24h)</span>
        </div>
        {data.incidents.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-600">
            <span className="text-green-400">✓</span> No incidents in the last 24 hours
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-800/50">
              {recentIncidents.map((incident, i) => {
                const time = new Date(incident.checked_at).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Los_Angeles'
                })
                return (
                  <div key={i} className="px-4 py-2.5 flex items-start gap-3">
                    <StatusDot status={incident.status as 'operational' | 'degraded' | 'down'} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{SERVICE_LABELS[incident.service_name] ?? incident.service_name}</span>
                        {incident.recovered_at && (
                          <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">Resolved</span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-0.5">{time} PT</div>
                      {incident.error_message && (
                        <div className="text-[10px] text-red-400 mt-0.5 truncate">{incident.error_message.slice(0, 60)}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {data.incidents.length > 5 && (
              <div className="px-4 py-2 border-t border-gray-800">
                <button
                  onClick={() => setExpandedIncidents(!expandedIncidents)}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {expandedIncidents ? '↑ Show less' : `↓ Show all ${data.incidents.length} incidents`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
