import { NextRequest } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getYouTubeId, getYouTubeDuration } from '@/lib/youtube'

export async function GET() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .order('sort_order')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Auto-detect YouTube video duration
  if (body.type === 'video' && body.url) {
    const ytId = getYouTubeId(body.url)
    if (ytId) {
      const duration = await getYouTubeDuration(ytId)
      body.duration_seconds = duration
    }
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('media')
    .insert(body)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('media')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  const supabase = getServiceClient()
  const { error } = await supabase.from('media').delete().eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
