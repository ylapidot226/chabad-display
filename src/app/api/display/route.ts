import { getServiceClient } from '@/lib/supabase'
import { fetchZmanim, getMinchaTime, getTzeit, getSunset, getCandleLightingTime, isShabbatOrYomTov } from '@/lib/zmanim'
import { getYouTubeId, getYouTubeDuration } from '@/lib/youtube'

export const dynamic = 'force-dynamic'

const dayNames: Record<string, number> = {
  'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3, 'חמישי': 4, 'שישי': 5, 'שבת': 6
}

function getTodayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Nicosia' })
}

interface PrayerTimeRow {
  id: number
  name: string
  time: string
  day_of_week: string | null
  notes: string | null
  sort_order: number
  active: boolean
  created_at: string
}

async function filterAndResolvePrayerTimes(prayerTimes: PrayerTimeRow[]) {
  // Fetch zmanim from Hebcal for dynamic time resolution
  await fetchZmanim()

  const dynamicTimes: Record<string, string> = {
    mincha: getMinchaTime(),
    arvit: getTzeit(),
    sunset: getSunset(),
    candles: getCandleLightingTime(),
  }

  const now = new Date()
  const nicosia = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Nicosia' }))
  const calendarDay = nicosia.getDay()
  const todayStr = getTodayStr()
  const isHolyDay = isShabbatOrYomTov()
  // Friday after candle lighting = halachically Shabbat, show Shabbat times
  const today = (isHolyDay && calendarDay === 5) ? 6 : calendarDay

  // Check if there are date-specific entries for today
  const hasDateSpecific = prayerTimes.some((pt) =>
    pt.active && pt.day_of_week && /^\d{4}-\d{2}-\d{2}$/.test(pt.day_of_week) && pt.day_of_week === todayStr
  )

  return prayerTimes
    .filter((pt) => {
      if (!pt.active) return false
      // Hide [WEEKDAY_ONLY] on Shabbat/Yom Tov
      if (pt.notes && pt.notes.indexOf('[WEEKDAY_ONLY]') !== -1 && isHolyDay) return false
      // Hide weekday-only evening prayers on Friday (evening will be Shabbat)
      if (pt.notes && pt.notes.indexOf('[HIDE_FRIDAY]') !== -1 && calendarDay === 5) return false

      // Date-specific entry: only show on that date
      if (pt.day_of_week && /^\d{4}-\d{2}-\d{2}$/.test(pt.day_of_week)) {
        return pt.day_of_week === todayStr
      }

      // If there are date-specific entries for today, hide all generic ones
      if (hasDateSpecific) return false

      // No day specified = every day
      if (!pt.day_of_week) return true

      // Match day of week
      return dayNames[pt.day_of_week] === today
    })
    .map((pt) => {
      // Resolve dynamic times
      let time = pt.time
      if (time === 'dynamic:mincha') time = dynamicTimes.mincha || '--:--'
      else if (time === 'dynamic:arvit') time = dynamicTimes.arvit || '--:--'
      else if (time === 'dynamic:sunset') time = dynamicTimes.sunset || '--:--'
      else if (time === 'dynamic:candles') time = dynamicTimes.candles || '--:--'

      // Clean up notes
      let notes = pt.notes ? pt.notes.replace('[WEEKDAY_ONLY]', '').replace('[HIDE_FRIDAY]', '').trim() : null
      if (notes === '') notes = null

      return { ...pt, time, notes }
    })
    .sort((a, b) => a.time.localeCompare(b.time))
}

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

  // Filter and resolve prayer times on the server
  const filteredPrayerTimes = await filterAndResolvePrayerTimes(prayerTimesRes.data || [])

  // Fetch actual YouTube video durations
  const mediaWithDurations = await Promise.all(
    (mediaRes.data || []).map(async (item: { type: string; url: string; duration_seconds: number }) => {
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

  return Response.json({
    media: mediaWithDurations,
    announcements: announcementsRes.data || [],
    prayer_times: filteredPrayerTimes,
    settings: settings,
  })
}
