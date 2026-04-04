// ─── AES-256-GCM Encryption ─────────────────────────────────────────────────
// Used to encrypt chat messages before storing in Supabase.
// Key is stored as CHAT_ENCRYPTION_KEY env var (32-byte hex string).
// Never stored in the database.

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const hex = process.env.CHAT_ENCRYPTION_KEY ?? ''
  if (!hex || hex.length < 32) {
    // Fallback for build-time (never used at runtime without the key)
    return Buffer.alloc(32, 0)
  }
  // Accept 64-char hex (32 bytes) or 32-char raw string
  if (hex.length === 64 && /^[0-9a-fA-F]+$/.test(hex)) {
    return Buffer.from(hex, 'hex')
  }
  // Pad/truncate raw string to 32 bytes
  return Buffer.from(hex.padEnd(32, '0').slice(0, 32), 'utf8')
}

export function encryptMessage(plaintext: string): string {
  try {
    const key = getKey()
    const iv = randomBytes(16)
    const cipher = createCipheriv(ALGORITHM, key, iv)
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()
    // Format: iv_hex:encrypted_b64:authTag_hex
    return `${iv.toString('hex')}:${encrypted.toString('base64')}:${authTag.toString('hex')}`
  } catch {
    // If encryption fails, return marker — never store plain sensitive text
    return '[ENCRYPTION_FAILED]'
  }
}

export function decryptMessage(ciphertext: string): string {
  try {
    if (!ciphertext || ciphertext === '[ENCRYPTION_FAILED]') return '[Unable to decrypt]'
    const parts = ciphertext.split(':')
    if (parts.length !== 3) return ciphertext // Legacy unencrypted message
    const [ivHex, encryptedB64, authTagHex] = parts
    const key = getKey()
    const iv = Buffer.from(ivHex, 'hex')
    const encrypted = Buffer.from(encryptedB64, 'base64')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    return '[Unable to decrypt]'
  }
}

// Detect sensitive data patterns before storing
export function containsSensitiveData(text: string): boolean {
  const patterns = [
    /\b(?:\d[ -]*?){13,16}\b/,               // Credit card numbers
    /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/,      // SSN
    /\b(?:acct|account|routing|aba)[\s#:]*\d{6,17}\b/i, // Bank accounts
  ]
  return patterns.some(p => p.test(text))
}
