'use client'

export type PasswordStrength = 'empty' | 'weak' | 'fair' | 'good' | 'strong'

export interface PasswordRequirements {
  minLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSymbol: boolean
}

export function checkPassword(password: string): {
  strength: PasswordStrength
  score: number
  requirements: PasswordRequirements
} {
  const requirements: PasswordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  }

  const score = Object.values(requirements).filter(Boolean).length

  if (password.length === 0) return { strength: 'empty', score: 0, requirements }
  if (score <= 2) return { strength: 'weak', score, requirements }
  if (score === 3) return { strength: 'fair', score, requirements }
  if (score === 4) return { strength: 'good', score, requirements }
  return { strength: 'strong', score, requirements }
}

export function isPasswordAcceptable(password: string): boolean {
  const { requirements } = checkPassword(password)
  // Must have: 8+ chars, 1 uppercase, 1 number, 1 symbol minimum
  return requirements.minLength && requirements.hasUppercase && requirements.hasNumber && requirements.hasSymbol
}

const STRENGTH_CONFIG = {
  empty:  { label: '',        color: 'bg-white/10',    textColor: 'text-gray-500',  bars: 0 },
  weak:   { label: 'Weak',    color: 'bg-red-500',     textColor: 'text-red-400',   bars: 1 },
  fair:   { label: 'Fair',    color: 'bg-yellow-500',  textColor: 'text-yellow-400',bars: 2 },
  good:   { label: 'Good',    color: 'bg-blue-400',    textColor: 'text-blue-400',  bars: 3 },
  strong: { label: 'Strong',  color: 'bg-green-500',   textColor: 'text-green-400', bars: 4 },
}

interface Props {
  password: string
  className?: string
}

export default function PasswordStrengthMeter({ password, className = '' }: Props) {
  const { strength, requirements } = checkPassword(password)
  const config = STRENGTH_CONFIG[strength]

  if (password.length === 0) return null

  const reqItems = [
    { key: 'minLength',    label: '8+ characters',         met: requirements.minLength },
    { key: 'hasUppercase', label: 'Uppercase letter (A-Z)', met: requirements.hasUppercase },
    { key: 'hasLowercase', label: 'Lowercase letter (a-z)', met: requirements.hasLowercase },
    { key: 'hasNumber',    label: 'Number (0-9)',           met: requirements.hasNumber },
    { key: 'hasSymbol',    label: 'Symbol (!@#$%...)',      met: requirements.hasSymbol },
  ]

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Strength bars */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                bar <= config.bars ? config.color : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        {config.label && (
          <span className={`text-xs font-semibold transition-colors duration-200 ${config.textColor}`}>
            {config.label}
          </span>
        )}
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-1 gap-0.5">
        {reqItems.map(({ key, label, met }) => (
          <div key={key} className="flex items-center gap-1.5">
            <svg
              className={`w-3.5 h-3.5 flex-shrink-0 transition-colors duration-200 ${
                met ? 'text-green-400' : 'text-white/25'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              {met ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0" />
              )}
            </svg>
            <span className={`text-xs transition-colors duration-200 ${met ? 'text-gray-300' : 'text-gray-600'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
