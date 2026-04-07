import { NextRequest } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { isAdmin } from '@/lib/auth'

export async function GET() {
  const supabase = getServiceClient()
  const { data, error } = await supabase.from('display_settings').select('*')

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const settings: Record<string, string> = {}
  data.forEach((row: { key: string; value: string }) => {
    settings[row.key] = row.value
  })
  return Response.json(settings)
}

export async function PUT(request: NextRequest) {
  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const supabase = getServiceClient()

  for (const [key, value] of Object.entries(body)) {
    await supabase
      .from('display_settings')
      .upsert({ key, value: value as string, updated_at: new Date().toISOString() })
  }

  return Response.json({ success: true })
}
