import { NextRequest } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const config = {
  api: { bodyParser: false },
}

// Allow up to 10MB uploads
export const maxDuration = 30

export async function POST(request: NextRequest) {

  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from('media')
    .upload(fileName, buffer, {
      contentType: file.type,
    })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { data: urlData } = supabase.storage
    .from('media')
    .getPublicUrl(fileName)

  return Response.json({ url: urlData.publicUrl })
}
