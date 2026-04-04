// ============================================================
// Centralized error logger — writes to errors table
// Never throws — always safe to call in catch blocks
// ============================================================

import { createAdminClient } from '@/lib/supabase/server'

export async function logError(
  type: string,
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('errors').insert({
      type,
      message,
      context: context ?? null,
    })
  } catch (err) {
    // If we can't log to DB, at minimum log to console
    console.error('[error-logger] Failed to write error to DB:', err)
    console.error('[error-logger] Original error:', { type, message, context })
  }
}

export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}

export function structuredError(
  message: string,
  statusCode: number = 500
): Response {
  return Response.json(
    { error: message, success: false },
    { status: statusCode }
  )
}
