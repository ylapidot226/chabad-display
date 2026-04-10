import { getServiceClient } from '@/lib/supabase'
import { fetchZmanim, getMinchaTime, getTzeit, getSunset, getCandleLightingTime, isShabbatOrYomTov } from '@/lib/zmanim'
import { getYouTubeId, getYouTubeDuration } from '@/lib/youtube'
import DisplayScreen from '@/components/DisplayScreen'
import type { MediaItem, Announcement, PrayerTime } from '@/lib/types'

export const dynamic = 'force-dynamic'

const dayNames: Record<string, number> = {
  'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3, 'חמישי': 4, 'שישי': 5, 'שבת': 6
}

function getTodayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Nicosia' })
}

async function filterAndResolvePrayerTimes(prayerTimes: PrayerTime[]) {
  await fetchZmanim()

  const dynamicTimes: Record<string, string> = {
    mincha: getMinchaTime(),
    arvit: getTzeit(),
    sunset: getSunset(),
    candles: getCandleLightingTime(),
  }

  const now = new Date()
  const nicosia = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Nicosia' }))
  const today = nicosia.getDay()
  const todayStr = getTodayStr()
  const isHolyDay = isShabbatOrYomTov()

  const hasDateSpecific = prayerTimes.some((pt) =>
    pt.active && pt.day_of_week && /^\d{4}-\d{2}-\d{2}$/.test(pt.day_of_week) && pt.day_of_week === todayStr
  )

  return prayerTimes
    .filter((pt) => {
      if (!pt.active) return false
      if (pt.notes && pt.notes.indexOf('[WEEKDAY_ONLY]') !== -1 && isHolyDay) return false

      if (pt.day_of_week && /^\d{4}-\d{2}-\d{2}$/.test(pt.day_of_week)) {
        return pt.day_of_week === todayStr
      }

      if (hasDateSpecific) return false
      if (!pt.day_of_week) return true
      return dayNames[pt.day_of_week] === today
    })
    .map((pt) => {
      let time = pt.time
      if (time === 'dynamic:mincha') time = dynamicTimes.mincha || '--:--'
      else if (time === 'dynamic:arvit') time = dynamicTimes.arvit || '--:--'
      else if (time === 'dynamic:sunset') time = dynamicTimes.sunset || '--:--'
      else if (time === 'dynamic:candles') time = dynamicTimes.candles || '--:--'

      let notes = pt.notes ? pt.notes.replace('[WEEKDAY_ONLY]', '').trim() : null
      if (notes === '') notes = null

      return { ...pt, time, notes }
    })
    .sort((a, b) => a.time.localeCompare(b.time))
}

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

  const filteredPrayerTimes = await filterAndResolvePrayerTimes((prayerTimesRes.data || []) as PrayerTime[])

  // Fetch actual YouTube video durations
  const mediaWithDurations = await Promise.all(
    ((mediaRes.data || []) as MediaItem[]).map(async (item) => {
      if (item.type === 'video') {
        const ytId = getYouTubeId(item.url)
        if (ytId && (!item.duration_seconds || item.duration_seconds <= 0)) {
          const duration = await getYouTubeDuration(ytId)
          return { ...item, duration_seconds: duration }
        }
      }
      return item
    })
  )

  return (
    <DisplayScreen
      initialMedia={mediaWithDurations}
      initialAnnouncements={(announcementsRes.data || []) as Announcement[]}
      initialPrayerTimes={filteredPrayerTimes}
      initialSettings={settings}
    />
  )
}
