import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getServiceClient()

  const [mediaRes, announcementsRes, prayerTimesRes, settingsRes] = await Promise.all([
    supabase.from('media').select('*').eq('active', true).order('sort_order'),
    supabase.from('announcements').select('*').eq('active', true).order('priority', { ascending: false }),
    supabase.from('prayer_times').select('*').eq('active', true).order('sort_order'),
    supabase.from('display_settings').select('*'),
  ])

  const settings: Record<string, string> = {}
  if (settingsRes.data) {
    settingsRes.data.forEach((row: { key: string; value: string }) => {
      settings[row.key] = row.value
    })
  }

  return Response.json({
    media: mediaRes.data || [],
    announcements: announcementsRes.data || [],
    prayer_times: prayerTimesRes.data || [],
    settings: settings,
  })
}
