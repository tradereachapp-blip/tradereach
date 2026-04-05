'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Contractor } from '@/types'
import { NICHES } from '@/lib/config'
import type { Niche } from '@/types'
import PhoneInput from './PhoneInput'
import { playAlertSound } from './LeadAlertSiren'
import AvatarComponent from './AvatarComponent'

interface Props {
  contractor: Contractor
  userEmail: string
}

const darkInput = 'dark-input'
const darkLabel = 'block text-sm font-medium text-gray-300 mb-1.5'

const ALERT_SOUNDS = [
  { value: 'siren', label: '🚨 Siren', description: 'Loud emergency alert — never miss a lead' },
  { value: 'chime', label: '🎵 Chime', description: 'Three ascending tones, pleasant and clear' },
  { value: 'bell', label: '🔔 Bell', description: 'Classic bell tone with long sustain' },
  { value: 'ping', label: '💬 Ping', description: 'Short sharp notification ping' },
  { value: 'ding', label: '🎶 Ding', description: 'Single soft ding, subtle alert' },
  { value: 'none', label: '🔇 Silent', description: 'No sound — visual alert only' },
]

function SectionCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-gray-900 rounded-2xl border border-white/8 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/8 bg-gray-800/40">
        <span className="text-xl">{icon}</span>
        <h2 className="text-base font-bold text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

function StatusMsg({ msg }: { msg: string }) {
  if (!msg) return null
  const isError = msg.startsWith('Error') || msg.includes('match') || msg.includes('8+') || msg.includes('Invalid') || msg.includes('Already') || msg.startsWith('Please')
  return (
    <p className={`text-sm mt-3 ${isError ? 'text-red-400' : 'text-green-400'}`}>{msg}</p>
  )
}

function DarkButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-gray-900"
    >
      {children}
    </button>
  )
}

export default function SettingsForm({ contractor, userEmail }: Props) {
  const supabase = createClient()

  // Business info
  const [businessName, setBusinessName] = useState(contractor.business_name)
  const [contactName, setContactName] = useState(contractor.contact_name)
  const [phone, setPhone] = useState(contractor.phone)
  const [licenseNumber, setLicenseNumber] = useState(contractor.license_number ?? '')
  const [niche, setNiche] = useState<Niche>(contractor.niche as Niche)
  const [savingInfo, setSavingInfo] = useState(false)
  const [infoMsg, setInfoMsg] = useState('')

  // ZIP codes
  const [zipCodes, setZipCodes] = useState<string[]>(contractor.zip_codes ?? [])
  const [zipInput, setZipInput] = useState('')
  const [zipError, setZipError] = useState('')
  const [savingZips, setSavingZips] = useState(false)
  const [zipMsg, setZipMsg] = useState('')

  // Notifications
  const [emailNotif, setEmailNotif] = useState(contractor.email_notifications ?? true)
  const [smsNotif, setSmsNotif] = useState(contractor.sms_notifications ?? true)
  const [smsNotifPhone, setSmsNotifPhone] = useState(contractor.sms_notification_phone ?? '')
  const [notificationEmail, setNotificationEmail] = useState(contractor.notification_email ?? userEmail)
  const [notifEmailError, setNotifEmailError] = useState('')
  const [smsPhoneError, setSmsPhoneError] = useState('')
  const [savingNotif, setSavingNotif] = useState(false)
  const [notifMsg, setNotifMsg] = useState('')

  // Alert sound
  const [alertSound, setAlertSound] = useState(contractor.alert_sound ?? 'siren')
  const [savingSound, setSavingSound] = useState(false)
  const [soundMsg, setSoundMsg] = useState('')

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPass, setSavingPass] = useState(false)
  const [passMsg, setPassMsg] = useState('')

  // Profile photo
  const [photoUrl, setPhotoUrl] = useState<string | null>((contractor as any).profile_photo_url ?? null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoMsg, setPhotoMsg] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)

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

  function handleZipInput(val: string) {
    const numeric = val.replace(/\D/g, '').slice(0, 5)
    setZipInput(numeric)
    setZipError('')
  }

  function addZip() {
    const z = zipInput.trim()
    if (!/^\d{5}$/.test(z)) { setZipError('Please enter a valid 5-digit ZIP code.'); return }
    if (zipCodes.includes(z)) { setZipError('Already in your list.'); return }
    setZipCodes([...zipCodes, z])
    setZipInput('')
    setZipError('')
  }

  function removeZip(z: string) { setZipCodes(zipCodes.filter(x => x !== z)) }

  async function saveZipCodes() {
    setSavingZips(true)
    setZipMsg('')
    const { error } = await supabase.from('contractors').update({ zip_codes: zipCodes }).eq('id', contractor.id)
    setZipMsg(error ? `Error: ${error.message}` : '✓ ZIP codes saved')
    setSavingZips(false)
  }

  async function saveNotifications() {
    if (notificationEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail.trim())) {
      setNotifEmailError('Please enter a valid email address.')
      return
    }
    setNotifEmailError('')
    setSmsPhoneError('')
    setSavingNotif(true)
    setNotifMsg('')
    const { error } = await supabase
      .from('contractors')
      .update({
        email_notifications: emailNotif,
        sms_notifications: smsNotif,
        sms_notification_phone: smsNotifPhone.trim() || null,
        notification_email: notificationEmail.trim() || null,
      })
      .eq('id', contractor.id)
    setNotifMsg(error ? `Error: ${error.message}` : '✓ Preferences saved')
    setSavingNotif(false)
  }

  async function saveAlertSound() {
    setSavingSound(true)
    setSoundMsg('')
    const { error } = await supabase.from('contractors').update({ alert_sound: alertSound }).eq('id', contractor.id)
    setSoundMsg(error ? `Error: ${error.message}` : '✓ Sound preference saved')
    setSavingSound(false)
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) { setPassMsg('Passwords do not match.'); return }
    if (newPassword.length < 8) { setPassMsg('Password must be 8+ characters.'); return }
    setSavingPass(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPassMsg(error ? `Error: ${error.message}` : '✓ Password updated')
    setNewPassword(''); setConfirmPassword('')
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

  async function uploadPhoto(file: File) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setPhotoMsg('Error: File must be under 5MB.'); return }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoMsg('Error: Only JPEG, PNG, or WebP allowed.'); return
    }
    setUploadingPhoto(true)
    setPhotoMsg('')
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${contractor.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('contractor-avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage
        .from('contractor-avatars')
        .getPublicUrl(path)
      // Bust cache by appending timestamp
      const urlWithBust = `${publicUrl}?t=${Date.now()}`
      const { error: dbError } = await supabase
        .from('contractors')
        .update({ profile_photo_url: urlWithBust })
        .eq('id', contractor.id)
      if (dbError) throw dbError
      setPhotoUrl(urlWithBust)
      setPhotoMsg('✓ Photo updated')
    } catch (e: any) {
      setPhotoMsg(`Error: ${e.message ?? 'Upload failed'}`)
    }
    setUploadingPhoto(false)
  }

  async function removePhoto() {
    if (!confirm('Remove your profile photo?')) return
    setUploadingPhoto(true)
    setPhotoMsg('')
    try {
      await supabase.storage.from('contractor-avatars').remove([
        `${contractor.id}/avatar.jpg`,
        `${contractor.id}/avatar.jpeg`,
        `${contractor.id}/avatar.png`,
        `${contractor.id}/avatar.webp`,
      ])
      const { error } = await supabase
        .from('contractors')
        .update({ profile_photo_url: null })
        .eq('id', contractor.id)
      if (error) throw error
      setPhotoUrl(null)
      setPhotoMsg('✓ Photo removed')
    } catch (e: any) {
      setPhotoMsg(`Error: ${e.message ?? 'Remove failed'}`)
    }
    setUploadingPhoto(false)
  }

  async function deleteAccount() {
    if (!confirm('Are you sure? This will permanently delete your account and cancel your subscription.')) return
    const res = await fetch('/api/contractors/settings', { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
    const data = await res.json()
    if (data.success) { await supabase.auth.signOut(); window.location.href = '/' }
    else alert(data.error || 'Failed to delete account.')
  }

  const planLabel = contractor.plan_type === 'elite' ? 'Elite' : contractor.plan_type === 'pro' ? 'Pro' : contractor.plan_type === 'pay_per_lead' ? 'Pay Per Lead' : null

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Profile Photo */}
      <SectionCard icon="📷" title="Profile Photo">
        <div className="flex items-center gap-6">
          <AvatarComponent
            photoUrl={photoUrl}
            contactName={contractor.contact_name}
            businessName={contractor.business_name}
            size={80}
            showOnlineDot={false}
          />
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-3">
              Your photo appears in the dashboard nav and your team profile. JPEG, PNG, or WebP — max 5MB.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f) }}
              />
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all hover:scale-[1.02]"
              >
                {uploadingPhoto ? 'Uploading...' : photoUrl ? 'Change Photo' : 'Upload Photo'}
              </button>
              {photoUrl && (
                <button
                  onClick={removePhoto}
                  disabled={uploadingPhoto}
                  className="border border-white/10 text-gray-400 hover:text-red-400 hover:border-red-500/30 font-semibold px-4 py-2 rounded-xl text-sm transition-all"
                >
                  Remove
                </button>
              )}
            </div>
            <StatusMsg msg={photoMsg} />
          </div>
        </div>
      </SectionCard>

      {/* Business Info */}
      <SectionCard icon="🏢" title="Business Information">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={darkLabel}>Business Name</label>
              <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className={darkInput} placeholder="Smith Roofing LLC" />
            </div>
            <div>
              <label className={darkLabel}>Contact Name</label>
              <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} className={darkInput} placeholder="John Smith" />
            </div>
          </div>
          <PhoneInput
            label="Business Phone"
            value={phone}
            onChange={setPhone}
            placeholder="(555) 555-5555"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={darkLabel}>License Number <span className="text-gray-500 font-normal">(Optional)</span></label>
              <input type="text" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} className={darkInput} placeholder="State license #" />
            </div>
            <div>
              <label className={darkLabel}>Service Type</label>
              <select value={niche} onChange={e => setNiche(e.target.value as Niche)} className={darkInput}>
                {NICHES.map(n => <option key={n} value={n} style={{ backgroundColor: '#1a2744', color: '#fff' }}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-500">Logged in as <span className="text-gray-400">{userEmail}</span></div>
            <DarkButton onClick={saveBusinessInfo} disabled={savingInfo}>
              {savingInfo ? 'Saving...' : 'Save Changes'}
            </DarkButton>
          </div>
          <StatusMsg msg={infoMsg} />
        </div>
      </SectionCard>

      {/* Service ZIP Codes */}
      <SectionCard icon="📍" title="Service ZIP Codes">
        <p className="text-gray-400 text-sm mb-4">Add the ZIP codes where you want to receive leads.</p>
        <div className="flex gap-2 mb-3">
          <input
            type="text" inputMode="numeric" pattern="[0-9]*"
            value={zipInput} onChange={e => handleZipInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addZip())}
            className={darkInput} placeholder="e.g. 90210" maxLength={5}
          />
          <button onClick={addZip} className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all whitespace-nowrap text-sm hover:scale-[1.02]">
            Add ZIP
          </button>
        </div>
        {zipError && <p className="text-red-400 text-sm mb-3">{zipError}</p>}
        {zipCodes.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {zipCodes.map(z => (
              <span key={z} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded-lg text-sm font-medium">
                {z}
                <button onClick={() => removeZip(z)} className="text-orange-400 hover:text-red-400 transition-colors ml-0.5 font-bold">×</button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic mb-4">No ZIP codes added yet.</p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">{zipCodes.length} ZIP code{zipCodes.length !== 1 ? 's' : ''} configured</p>
          <DarkButton onClick={saveZipCodes} disabled={savingZips}>{savingZips ? 'Saving...' : 'Save ZIP Codes'}</DarkButton>
        </div>
        <StatusMsg msg={zipMsg} />
      </SectionCard>

      {/* Notification Preferences */}
      <SectionCard icon="🔔" title="Notification Preferences">
        <div className="space-y-5">
          {/* Toggles */}
          <div className="space-y-3">
            {[
              { label: 'Email Notifications', sub: 'Receive email alerts when new leads come in', icon: '📧', checked: emailNotif, onChange: setEmailNotif },
              { label: 'SMS Notifications', sub: 'Receive instant text alerts for new leads', icon: '📱', checked: smsNotif, onChange: setSmsNotif },
            ].map(({ label, sub, icon, checked, onChange }) => (
              <label key={label} className="flex items-center justify-between p-4 bg-gray-800/50 border border-white/6 rounded-xl cursor-pointer hover:border-white/12 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <div>
                    <div className="font-medium text-white text-sm">{label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
                  </div>
                </div>
                <div className="relative flex-shrink-0">
                  <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-checked:bg-orange-500 rounded-full transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            ))}
          </div>

          {/* Notification Email */}
          <div className="border-t border-white/8 pt-5">
            <label className={darkLabel}>Notification Email Address</label>
            <p className="text-xs text-gray-500 mb-2">Lead alerts will be sent to this address. Leave blank to use your login email.</p>
            <input type="email" value={notificationEmail} onChange={e => { setNotificationEmail(e.target.value); setNotifEmailError('') }} className={darkInput} placeholder={userEmail} />
            {notifEmailError && <p className="text-red-400 text-xs mt-1.5">{notifEmailError}</p>}
          </div>

          {/* SMS Notification Phone — premium input */}
          <div className="pt-4">
            <PhoneInput
              label="SMS Notification Number"
              description="The number that receives instant lead alerts. Leave blank to use your business phone."
              value={smsNotifPhone}
              onChange={setSmsNotifPhone}
              error={smsPhoneError}
            />
          </div>

          <div className="flex justify-end">
            <DarkButton onClick={saveNotifications} disabled={savingNotif}>{savingNotif ? 'Saving...' : 'Save Preferences'}</DarkButton>
          </div>
          <StatusMsg msg={notifMsg} />
        </div>
      </SectionCard>

      {/* Alert Sound */}
      <SectionCard icon="🔊" title="Alert Sound">
        <p className="text-gray-400 text-sm mb-5">Choose the alert sound you hear when a new lead arrives in your territory.</p>
        <div className="space-y-2 mb-5">
          {ALERT_SOUNDS.map(({ value, label, description }) => (
            <label
              key={value}
              className={`flex items-center gap-4 p-3.5 rounded-xl border cursor-pointer transition-all ${
                alertSound === value
                  ? 'border-orange-500/40 bg-orange-500/8'
                  : 'border-white/6 bg-gray-800/40 hover:border-white/12'
              }`}
            >
              <input
                type="radio"
                name="alertSound"
                value={value}
                checked={alertSound === value}
                onChange={() => setAlertSound(value)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${alertSound === value ? 'border-orange-500' : 'border-gray-600'}`}>
                {alertSound === value && <div className="w-2 h-2 rounded-full bg-orange-500" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-xs text-gray-500">{description}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => playAlertSound(alertSound)}
            className="flex items-center gap-2 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Preview Sound
          </button>
          <DarkButton onClick={saveAlertSound} disabled={savingSound}>{savingSound ? 'Saving...' : 'Save Sound'}</DarkButton>
        </div>
        <StatusMsg msg={soundMsg} />
      </SectionCard>

      {/* Subscription */}
      <SectionCard icon="💳" title="Subscription & Billing">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white font-medium mb-1">Current Plan</p>
            {planLabel ? (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                contractor.plan_type === 'elite' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                : contractor.plan_type === 'pro' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                : 'bg-gray-700 text-gray-300 border border-white/10'
              }`}>
                {planLabel}
              </span>
            ) : (
              <span className="text-xs text-gray-500">No active plan</span>
            )}
          </div>
          <p className="text-xs text-gray-500 text-right">Managed securely<br />through Stripe</p>
        </div>
        <p className="text-gray-400 text-sm mb-5">Update your payment method, view invoices, and manage your subscription.</p>
        <div className="flex flex-wrap gap-3">
          <DarkButton onClick={openBillingPortal} disabled={loadingPortal}>{loadingPortal ? 'Opening...' : 'Manage Billing & Subscription'}</DarkButton>
          {!contractor.stripe_customer_id && (
            <a href="/onboarding" className="border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm hover:scale-[1.02]">
              Upgrade Plan
            </a>
          )}
        </div>
      </SectionCard>

      {/* Security */}
      <SectionCard icon="🔒" title="Security">
        <div className="space-y-4">
          <div>
            <label className={darkLabel}>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={darkInput} placeholder="Minimum 8 characters" />
          </div>
          <div>
            <label className={darkLabel}>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={darkInput} placeholder="•••••••••" />
          </div>
          <div className="flex justify-end">
            <DarkButton onClick={changePassword} disabled={savingPass}>{savingPass ? 'Updating...' : 'Update Password'}</DarkButton>
          </div>
          <StatusMsg msg={passMsg} />
        </div>
      </SectionCard>

      {/* Danger Zone */}
      <section className="bg-red-500/5 rounded-2xl border border-red-500/20 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-red-500/15">
          <span className="text-xl">⚠️</span>
          <h2 className="text-base font-bold text-red-400">Danger Zone</h2>
        </div>
        <div className="p-6">
          <p className="text-red-300/70 text-sm mb-5">
            Deleting your account will immediately cancel your subscription and remove all your data. This cannot be undone.
          </p>
          <button
            onClick={deleteAccount}
            className="border border-red-500/30 text-red-400 hover:bg-red-500/10 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm hover:scale-[1.02]"
          >
            Delete Account
          </button>
        </div>
      </section>

    </div>
  )
}
