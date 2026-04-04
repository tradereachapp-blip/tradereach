'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Contractor } from '@/types'
import { NICHES } from '@/lib/config'
import type { Niche } from '@/types'

interface Props {
  contractor: Contractor
  userEmail: string
}

export default function SettingsForm({ contractor, userEmail }: Props) {
  const supabase = createClient()

  // Business info state
  const [businessName, setBusinessName] = useState(contractor.business_name)
  const [contactName, setContactName] = useState(contractor.contact_name)
  const [phone, setPhone] = useState(contractor.phone)
  const [licenseNumber, setLicenseNumber] = useState(contractor.license_number ?? '')
  const [niche, setNiche] = useState<Niche>(contractor.niche as Niche)
  const [savingInfo, setSavingInfo] = useState(false)
  const [infoMsg, setInfoMsg] = useState('')

  // ZIP codes state
  const [zipCodes, setZipCodes] = useState<string[]>(contractor.zip_codes)
  const [zipInput, setZipInput] = useState('')
  const [savingZips, setSavingZips] = useState(false)
  const [zipMsg, setZipMsg] = useState('')

  // Notifications
  const [emailNotif, setEmailNotif] = useState(contractor.email_notifications ?? true)
  const [smsNotif, setSmsNotif] = useState(contractor.sms_notifications ?? true)
  const [savingNotif, setSavingNotif] = useState(false)
  const [notifMsg, setNotifMsg] = useState('')

  // Password change
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPass, setSavingPass] = useState(false)
  const [passMsg, setPassMsg] = useState('')

  // Portal
  const [loadingPortal, setLoadingPortal] = useState(false)

  async function saveBusinessInfo() {
    setSavingInfo(true)
    setInfoMsg('')
    const { error } = await supabase
      .from('contractors')
      .update({ business_name: businessName, contact_name: contactName, phone, license_number: licenseNumber || null, niche })
      .eq('id', contractor.id)

    setInfoMsg(error ? `Error: ${error.message}` : '✓ Saved successfully')
    setSavingInfo(false)
  }

  function addZip() {
    const z = zipInput.trim()
    if (!/^\d{5}$/.test(z)) { setZipMsg('Invalid ZIP code.'); return }
    if (zipCodes.includes(z)) { setZipMsg('Already added.'); return }
    setZipCodes([...zipCodes, z])
    setZipInput('')
    setZipMsg('')
  }

  function removeZip(z: string) { setZipCodes(zipCodes.filter(x => x !== z)) }

  async function saveZipCodes() {
    setSavingZips(true)
    setZipMsg('')
    const { error } = await supabase
      .from('contractors').update({ zip_codes: zipCodes }).eq('id', contractor.id)
    setZipMsg(error ? `Error: ${error.message}` : '✓ ZIP codes saved')
    setSavingZips(false)
  }

  async function saveNotifications() {
    setSavingNotif(true)
    const { error } = await supabase
      .from('contractors').update({ email_notifications: emailNotif, sms_notifications: smsNotif }).eq('id', contractor.id)
    setNotifMsg(error ? `Error: ${error.message}` : '✓ Preferences saved')
    setSavingNotif(false)
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) { setPassMsg('Passwords do not match.'); return }
    if (newPassword.length < 8) { setPassMsg('Password must be 8+ characters.'); return }
    setSavingPass(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPassMsg(error ? `Error: ${error.message}` : '✓ Password updated')
    setNewPassword('')
    setConfirmPassword('')
    setSavingPass(false)
  }

  async function openBillingPortal() {
    setLoadingPortal(true)
    const res = await fetch('/api/stripe/billing-portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else alert(data.error || 'Could not open billing portal.')
    setLoadingPortal(false)
  }

  async function deleteAccount() {
    if (!confirm('Are you sure? This will permanently delete your account and cancel your subscription. This cannot be undone.')) return
    const { error } = await supabase.auth.admin?.deleteUser ? 
      { error: null } : { error: new Error('Use admin panel') }
    // Call server API to delete
    const res = await fetch('/api/contractors/settings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (data.success) {
      await supabase.auth.signOut()
      window.location.href = '/'
    } else {
      alert(data.error || 'Failed to delete account.')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Business Info */}
      <section className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Business Information</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Business Name</label>
            <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Contact Name</label>
            <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">License Number (Optional)</label>
            <input type="text" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Niche</label>
            <select value={niche} onChange={e => setNiche(e.target.value as Niche)} className="input-field">
              {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {infoMsg && <p className={`text-sm ${infoMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{infoMsg}</p>}
          <button onClick={saveBusinessInfo} disabled={savingInfo} className="btn-primary">
            {savingInfo ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>

      {/* ZIP Codes */}
      <section className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Service ZIP Codes</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={zipInput}
            onChange={e => setZipInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addZip())}
            className="input-field"
            placeholder="e.g. 90210"
            maxLength={5}
          />
          <button onClick={addZip} className="btn-primary whitespace-nowrap">Add ZIP</button>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {zipCodes.map(z => (
            <span key={z} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-full text-sm">
              {z}
              <button onClick={() => removeZip(z)} className="ml-1 text-blue-400 hover:text-red-500">×</button>
            </span>
          ))}
        </div>
        {zipMsg && <p className={`text-sm mb-3 ${zipMsg.startsWith('Error') ? 'text-red-600' : zipMsg.startsWith('Invalid') || zipMsg.startsWith('Already') ? 'text-amber-600' : 'text-green-600'}`}>{zipMsg}</p>}
        <button onClick={saveZipCodes} disabled={savingZips} className="btn-primary">
          {savingZips ? 'Saving...' : 'Save ZIP Codes'}
        </button>
      </section>

      {/* Notification Preferences */}
      <section className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Notification Preferences</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={emailNotif} onChange={e => setEmailNotif(e.target.checked)}
              className="w-5 h-5 rounded text-orange-500 focus:ring-orange-400" />
            <div>
              <div className="font-medium text-gray-900">Email Notifications</div>
              <div className="text-sm text-gray-500">Receive email alerts for new leads</div>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={smsNotif} onChange={e => setSmsNotif(e.target.checked)}
              className="w-5 h-5 rounded text-orange-500 focus:ring-orange-400" />
            <div>
              <div className="font-medium text-gray-900">SMS Notifications</div>
              <div className="text-sm text-gray-500">Receive text alerts for new leads</div>
            </div>
          </label>
        </div>
        {notifMsg && <p className={`text-sm mt-3 ${notifMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{notifMsg}</p>}
        <button onClick={saveNotifications} disabled={savingNotif} className="btn-primary mt-4">
          {savingNotif ? 'Saving...' : 'Save Preferences'}
        </button>
      </section>

      {/* Subscription */}
      <section className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Subscription</h2>
        <p className="text-gray-500 text-sm mb-4">
          Manage your plan, update payment method, and view invoices through Stripe's secure billing portal.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={openBillingPortal} disabled={loadingPortal} className="btn-primary">
            {loadingPortal ? 'Opening...' : 'Manage Billing & Subscription'}
          </button>
          {!contractor.stripe_customer_id && (
            <a href="/onboarding" className="btn-outline">Upgrade Plan</a>
          )}
        </div>
      </section>

      {/* Change Password */}
      <section className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Change Password</h2>
        <div className="space-y-3">
          <div>
            <label className="label">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" placeholder="Minimum 8 characters" />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field" placeholder="••••••••" />
          </div>
          {passMsg && <p className={`text-sm ${passMsg.startsWith('Error') || passMsg.includes('match') || passMsg.includes('8+') ? 'text-red-600' : 'text-green-600'}`}>{passMsg}</p>}
          <button onClick={changePassword} disabled={savingPass} className="btn-primary">
            {savingPass ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="card border border-red-200 bg-red-50">
        <h2 className="text-lg font-bold text-red-700 mb-2">Danger Zone</h2>
        <p className="text-red-600 text-sm mb-4">
          Deleting your account will immediately cancel your subscription and permanently remove all your data. This cannot be undone.
        </p>
        <button
          onClick={deleteAccount}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-all text-sm"
        >
          Delete Account
        </button>
      </section>
    </div>
  )
}
