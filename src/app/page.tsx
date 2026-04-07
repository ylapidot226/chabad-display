import { getServiceClient } from '@/lib/supabase'
import DisplayScreen from '@/components/DisplayScreen'
import type { MediaItem, Announcement, PrayerTime } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function Home() {
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

  return (
    <DisplayScreen
      initialMedia={(mediaRes.data || []) as MediaItem[]}
      initialAnnouncements={(announcementsRes.data || []) as Announcement[]}
      initialPrayerTimes={(prayerTimesRes.data || []) as PrayerTime[]}
      initialSettings={settings}
    />
  )
}
