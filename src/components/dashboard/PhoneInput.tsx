'use client'

import { useState, useEffect, useRef } from 'react'

interface Country {
  code: string
  dial: string
  flag: string
  name: string
}

const COUNTRIES: Country[] = [
  // Top — USA always first
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States' },
  { code: 'CA', dial: '+1', flag: '🇨🇦', name: 'Canada' },
  // Divider handled by index — then alphabetical
  { code: 'AF', dial: '+93', flag: '🇦🇫', name: 'Afghanistan' },
  { code: 'AL', dial: '+355', flag: '🇦🇱', name: 'Albania' },
  { code: 'DZ', dial: '+213', flag: '🇩🇿', name: 'Algeria' },
  { code: 'AR', dial: '+54', flag: '🇦🇷', name: 'Argentina' },
  { code: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: 'AT', dial: '+43', flag: '🇦🇹', name: 'Austria' },
  { code: 'BE', dial: '+32', flag: '🇧🇪', name: 'Belgium' },
  { code: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: 'BG', dial: '+359', flag: '🇧🇬', name: 'Bulgaria' },
  { code: 'KH', dial: '+855', flag: '🇰🇭', name: 'Cambodia' },
  { code: 'CL', dial: '+56', flag: '🇨🇱', name: 'Chile' },
  { code: 'CN', dial: '+86', flag: '🇨🇳', name: 'China' },
  { code: 'CO', dial: '+57', flag: '🇨🇴', name: 'Colombia' },
  { code: 'HR', dial: '+385', flag: '🇭🇷', name: 'Croatia' },
  { code: 'CZ', dial: '+420', flag: '🇨🇿', name: 'Czech Republic' },
  { code: 'DK', dial: '+45', flag: '🇩🇰', name: 'Denmark' },
  { code: 'EG', dial: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: 'FI', dial: '+358', flag: '🇫🇮', name: 'Finland' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: 'GH', dial: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: 'GR', dial: '+30', flag: '🇬🇷', name: 'Greece' },
  { code: 'HK', dial: '+852', flag: '🇭🇰', name: 'Hong Kong' },
  { code: 'HU', dial: '+36', flag: '🇭🇺', name: 'Hungary' },
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India' },
  { code: 'ID', dial: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { code: 'IE', dial: '+353', flag: '🇮🇪', name: 'Ireland' },
  { code: 'IL', dial: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: 'IT', dial: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: 'JP', dial: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: 'JO', dial: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: 'KE', dial: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: 'KW', dial: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: 'LB', dial: '+961', flag: '🇱🇧', name: 'Lebanon' },
  { code: 'MY', dial: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: 'MX', dial: '+52', flag: '🇲🇽', name: 'Mexico' },
  { code: 'MA', dial: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: 'NL', dial: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { code: 'NZ', dial: '+64', flag: '🇳🇿', name: 'New Zealand' },
  { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'NO', dial: '+47', flag: '🇳🇴', name: 'Norway' },
  { code: 'PK', dial: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: 'PE', dial: '+51', flag: '🇵🇪', name: 'Peru' },
  { code: 'PH', dial: '+63', flag: '🇵🇭', name: 'Philippines' },
  { code: 'PL', dial: '+48', flag: '🇵🇱', name: 'Poland' },
  { code: 'PT', dial: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: 'QA', dial: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: 'RO', dial: '+40', flag: '🇷🇴', name: 'Romania' },
  { code: 'RU', dial: '+7', flag: '🇷🇺', name: 'Russia' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'SG', dial: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: 'ZA', dial: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: 'KR', dial: '+82', flag: '🇰🇷', name: 'South Korea' },
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: 'SE', dial: '+46', flag: '🇸🇪', name: 'Sweden' },
  { code: 'CH', dial: '+41', flag: '🇨🇭', name: 'Switzerland' },
  { code: 'TW', dial: '+886', flag: '🇹🇼', name: 'Taiwan' },
  { code: 'TH', dial: '+66', flag: '🇹🇭', name: 'Thailand' },
  { code: 'TN', dial: '+216', flag: '🇹🇳', name: 'Tunisia' },
  { code: 'TR', dial: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: 'UA', dial: '+380', flag: '🇺🇦', name: 'Ukraine' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'VN', dial: '+84', flag: '🇻🇳', name: 'Vietnam' },
]

// Parse E.164 or raw number into {dialCode, local}
function parsePhone(value: string): { country: Country; local: string } {
  const defaultCountry = COUNTRIES[0] // US
  if (!value) return { country: defaultCountry, local: '' }

  const cleaned = value.replace(/\s/g, '')

  // Try to match a country dial code
  // Sort by longest dial code first to avoid prefix collisions
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
  for (const country of sorted) {
    if (cleaned.startsWith(country.dial)) {
      const local = cleaned.slice(country.dial.length).replace(/\D/g, '')
      // Special case: +1 — prefer US over Canada
      if (country.dial === '+1' && country.code !== 'US') continue
      return { country, local }
    }
  }

  // No match — assume US, strip non-digits
  return { country: defaultCountry, local: cleaned.replace(/\D/g, '') }
}

function formatLocal(local: string, dialCode: string): string {
  const digits = local.replace(/\D/g, '')
  // US/Canada formatting
  if (dialCode === '+1' && digits.length <= 10) {
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }
  return digits
}

interface Props {
  value: string
  onChange: (e164: string) => void
  placeholder?: string
  label?: string
  description?: string
  error?: string
}

export default function PhoneInput({ value, onChange, placeholder, label, description, error }: Props) {
  const parsed = parsePhone(value)
  const [selectedCountry, setSelectedCountry] = useState<Country>(parsed.country)
  const [localNumber, setLocalNumber] = useState(parsed.local)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Sync if value changes externally
  useEffect(() => {
    const p = parsePhone(value)
    setSelectedCountry(p.country)
    setLocalNumber(p.local)
  }, [value])

  useEffect(() => {
    if (dropdownOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [dropdownOpen])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLocalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 15)
    setLocalNumber(raw)
    const e164 = raw ? `${selectedCountry.dial}${raw}` : ''
    onChange(e164)
  }

  function selectCountry(country: Country) {
    setSelectedCountry(country)
    setDropdownOpen(false)
    setSearch('')
    const e164 = localNumber ? `${country.dial}${localNumber}` : ''
    onChange(e164)
  }

  const filteredCountries = search
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES

  const topTwo = COUNTRIES.slice(0, 2)
  const rest = filteredCountries.filter(c => c.code !== 'US' && c.code !== 'CA')

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      )}
      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}
      <div className="flex gap-0 rounded-xl overflow-visible border border-white/10 focus-within:border-orange-500/50 transition-colors bg-gray-800/60">
        {/* Country selector */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-3 h-full border-r border-white/10 hover:bg-white/5 transition-colors rounded-l-xl text-sm font-medium text-white min-w-[90px]"
          >
            <span className="text-lg leading-none">{selectedCountry.flag}</span>
            <span className="text-gray-300">{selectedCountry.dial}</span>
            <svg className={`w-3 h-3 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-1 w-72 bg-gray-900 border border-white/12 rounded-xl shadow-2xl z-50 overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-white/8">
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search country..."
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              {/* Country list */}
              <div className="max-h-56 overflow-y-auto">
                {!search && (
                  <>
                    {topTwo.map(c => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => selectCountry(c)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left ${
                          selectedCountry.code === c.code ? 'bg-orange-500/10 text-orange-300' : 'text-gray-200'
                        }`}
                      >
                        <span className="text-lg">{c.flag}</span>
                        <span className="flex-1">{c.name}</span>
                        <span className="text-gray-500 text-xs">{c.dial}</span>
                      </button>
                    ))}
                    <div className="border-t border-white/8 mx-3 my-1" />
                  </>
                )}
                {(search ? filteredCountries : rest).map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => selectCountry(c)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left ${
                      selectedCountry.code === c.code ? 'bg-orange-500/10 text-orange-300' : 'text-gray-200'
                    }`}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <span className="flex-1">{c.name}</span>
                    <span className="text-gray-500 text-xs">{c.dial}</span>
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <p className="text-center text-gray-500 text-sm py-4">No countries found</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Local number input */}
        <input
          type="tel"
          value={formatLocal(localNumber, selectedCountry.dial)}
          onChange={handleLocalChange}
          placeholder={placeholder ?? (selectedCountry.dial === '+1' ? '(555) 555-5555' : 'Phone number')}
          className="flex-1 bg-transparent px-3 py-3 text-sm text-white placeholder-gray-500 focus:outline-none rounded-r-xl"
        />
      </div>
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  )
}
