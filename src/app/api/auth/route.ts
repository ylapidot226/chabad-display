import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (password === '226') {
    const cookieStore = await cookies()
    cookieStore.set('admin_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })
    return Response.json({ success: true })
  }

  return Response.json({ error: 'סיסמה שגויה' }, { status: 401 })
}
