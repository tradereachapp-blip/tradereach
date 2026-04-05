'use client'

import { useState } from 'react'

interface TeamMember {
  id: string
  created_at: string
  owner_contractor_id: string
  user_id: string | null
  email: string
  name: string
  role: string
  status: string
  invitation_token: string | null
  invitation_expires_at: string | null
  stripe_subscription_item_id: string | null
  notifications_enabled: boolean
}

interface Props {
  initialMembers: TeamMember[]
  isElite: boolean
  freeSlots: number
  planType: string
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-500/15 text-green-400 border border-green-500/30',
  pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  inactive: 'bg-gray-500/15 text-gray-400 border border-gray-500/30',
}

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  member: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
}

export default function TeamManagementClient({ initialMembers, isElite, freeSlots, planType }: Props) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError('')
    setInviteSuccess('')

    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole }),
    })
    const data = await res.json()

    if (!res.ok) {
      setInviteError(data.error ?? 'Something went wrong')
      setInviting(false)
      return
    }

    setMembers(prev => [...prev, data.member])
    setInviteEmail('')
    setInviteName('')
    setInviteRole('member')
    setShowInviteForm(false)
    setInviting(false)
    showToast(`Invitation sent to ${inviteEmail}`)
  }

  async function handleRemove(memberId: string, memberName: string) {
    if (!confirm(`Remove ${memberName} from your team? This will stop their access immediately.`)) return
    setRemovingId(memberId)

    const res = await fetch(`/api/team/${memberId}`, { method: 'DELETE' })
    if (res.ok) {
      setMembers(prev => prev.filter(m => m.id !== memberId))
      showToast(`${memberName} removed from team`)
    } else {
      const data = await res.json()
      showToast(data.error ?? 'Failed to remove member', 'error')
    }
    setRemovingId(null)
  }

  async function handleToggleNotifications(member: TeamMember) {
    const newVal = !member.notifications_enabled
    const res = await fetch(`/api/team/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifications_enabled: newVal }),
    })
    if (res.ok) {
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, notifications_enabled: newVal } : m))
    }
  }

  const activeCount = members.filter(m => m.status === 'active').length
  const isFree = isElite && activeCount < 1

  return (
    <div className="space-y-6">
      {/* Billing info banner */}
      <div className="bg-gray-900 border border-white/8 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-orange-500/15 rounded-xl flex items-center justify-center flex-shrink-0 border border-orange-500/20">
          <span className="text-lg">👥</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white mb-0.5">Team Seats</p>
          <p className="text-xs text-gray-400">
            {isElite
              ? freeSlots > 0
                ? 'You have 1 free team seat included with Elite. Additional seats are $49/month each.'
                : 'Your free Elite seat is used. Additional seats are $49/month each.'
              : 'Each team member is $49/month, billed on your current subscription cycle.'}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-black text-white">{activeCount}</p>
          <p className="text-xs text-gray-500">active</p>
        </div>
      </div>

      {/* Member list */}
      <div className="space-y-3">
        {members.length === 0 && !showInviteForm && (
          <div className="bg-gray-900 border border-white/8 rounded-2xl text-center py-14 px-6">
            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
              <span className="text-2xl">👤</span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">No team members yet</h3>
            <p className="text-gray-500 text-sm mb-5 max-w-xs mx-auto">
              Invite your crew — they'll get access to your leads dashboard and can receive lead alerts.
            </p>
            <button
              onClick={() => setShowInviteForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm hover:scale-[1.02]"
            >
              + Invite First Member
            </button>
          </div>
        )}

        {members.map(member => (
          <div key={member.id} className="bg-gray-900 border border-white/8 rounded-2xl p-4 flex items-center gap-4">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white text-sm font-black flex-shrink-0 border border-white/8">
              {member.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-white truncate">{member.name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_STYLES[member.role] ?? ROLE_STYLES.member}`}>
                  {member.role}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[member.status] ?? STATUS_STYLES.inactive}`}>
                  {member.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{member.email}</p>
              {member.status === 'pending' && (
                <p className="text-xs text-amber-400/70 mt-0.5">Awaiting acceptance</p>
              )}
            </div>

            {/* Notifications toggle */}
            {member.status === 'active' && (
              <button
                onClick={() => handleToggleNotifications(member)}
                title={member.notifications_enabled ? 'Disable lead alerts for this member' : 'Enable lead alerts for this member'}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  member.notifications_enabled
                    ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                    : 'bg-gray-800 border-white/10 text-gray-500 hover:text-gray-300'
                }`}
              >
                <span>{member.notifications_enabled ? '🔔' : '🔕'}</span>
                <span className="hidden sm:inline">{member.notifications_enabled ? 'Alerts on' : 'Alerts off'}</span>
              </button>
            )}

            {/* Remove */}
            <button
              onClick={() => handleRemove(member.id, member.name)}
              disabled={removingId === member.id}
              className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
              title="Remove from team"
            >
              {removingId === member.id ? (
                <div className="w-4 h-4 border border-gray-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Invite form */}
      {showInviteForm ? (
        <div className="bg-gray-900 border border-orange-500/20 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Invite Team Member</h3>
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  required
                  placeholder="Jane Smith"
                  className="w-full bg-gray-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                  placeholder="jane@company.com"
                  className="w-full bg-gray-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Role</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="w-full bg-gray-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              >
                <option value="member">Member — can view leads and claim them</option>
                <option value="admin">Admin — full access including settings</option>
              </select>
            </div>

            {!isFree && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-400">
                  💳 Adding this member will add <strong>$49/month</strong> to your subscription, billed immediately on a prorated basis.
                </p>
              </div>
            )}
            {isFree && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <p className="text-xs text-green-400">
                  ✅ First team member is <strong>free</strong> with your Elite plan.
                </p>
              </div>
            )}

            {inviteError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{inviteError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={inviting}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-all text-sm hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviting ? 'Sending…' : 'Send Invitation'}
              </button>
              <button
                type="button"
                onClick={() => { setShowInviteForm(false); setInviteError('') }}
                className="px-4 py-2.5 bg-gray-800 border border-white/10 text-gray-400 hover:text-white rounded-xl transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : members.length > 0 && (
        <button
          onClick={() => setShowInviteForm(true)}
          className="w-full py-3 border border-dashed border-white/15 rounded-2xl text-gray-500 hover:text-white hover:border-orange-500/40 hover:bg-orange-500/5 transition-all text-sm font-medium"
        >
          + Invite Another Member
        </button>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all ${
          toast.type === 'success'
            ? 'bg-gray-900 border-green-500/30 text-white'
            : 'bg-gray-900 border-red-500/30 text-red-400'
        }`}>
          <div className={`w-1 h-8 rounded-full flex-shrink-0 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
          {toast.msg}
        </div>
      )}
    </div>
  )
}
