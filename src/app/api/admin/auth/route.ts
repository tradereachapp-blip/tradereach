import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  const expectedUsername = process.env.ADMIN_USERNAME
  const expectedPassword = process.env.ADMIN_PASSWORD

  if (!expectedPassword) {
    return NextResponse.json({ error: 'Admin auth not configured' }, { status: 500 })
  }

  const usernameOk = expectedUsername ? username === expectedUsername : true
  const passwordOk = password === expectedPassword

  if (!usernameOk || !passwordOk) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set('admin_session', expectedPassword, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin',
    maxAge: 60 * 60 * 8, // 8 hours
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
  return NextResponse.json({ ok: true })
}
