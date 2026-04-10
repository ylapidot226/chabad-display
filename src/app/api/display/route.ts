import { getServiceClient } from '@/lib/supabase'
import { fetchZmanim, isShabbatOrYomTov } from '@/lib/zmanim'
import { getYouTubeId, getYouTubeDuration } from '@/lib/youtube'

export const dynamic = 'force-dynamic'

const dayNames: Record<string, number> = {
  'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3, 'חמישי': 4, 'שישי': 5, 'שבת': 6
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

function computeDynamicTimes(zmanim: { sunset: string; tzeit85deg: string; candles: string }) {
  const [h, m] = zmanim.sunset.split(':').map(Number)
  const totalMin = h * 60 + m - 15
  const mincha = Math.floor(totalMin / 60).toString().padStart(2, '0') + ':' + (totalMin % 60).toString().padStart(2, '0')
  return { mincha, arvit: zmanim.tzeit85deg, sunset: zmanim.sunset, candles: zmanim.candles }
}

function resolveDynamic(time: string, dynTimes: Record<string, string>): string {
  if (time === 'dynamic:mincha') return dynTimes.mincha || '--:--'
  if (time === 'dynamic:arvit') return dynTimes.arvit || '--:--'
  if (time === 'dynamic:sunset') return dynTimes.sunset || '--:--'
  if (time === 'dynamic:candles') return dynTimes.candles || '--:--'
  return time
}

function cleanNotes(notes: string | null): string | null {
  if (!notes) return null
  let clean = notes.replace('[WEEKDAY_ONLY]', '').replace('[HIDE_FRIDAY]', '').trim()
  return clean === '' ? null : clean
}

function filterByDay(
  prayerTimes: PrayerTimeRow[],
  dayNum: number,
  dateStr: string,
  isHolyDay: boolean,
  calendarDay: number,
) {
  const hasDateSpecific = prayerTimes.some((pt) =>
    pt.active && pt.day_of_week && /^\d{4}-\d{2}-\d{2}$/.test(pt.day_of_week) && pt.day_of_week === dateStr
  )

  return prayerTimes.filter((pt) => {
    if (!pt.active) return false
    if (pt.notes && pt.notes.indexOf('[WEEKDAY_ONLY]') !== -1 && isHolyDay) return false
    if (pt.notes && pt.notes.indexOf('[HIDE_FRIDAY]') !== -1 && calendarDay === 5) return false

    if (pt.day_of_week && /^\d{4}-\d{2}-\d{2}$/.test(pt.day_of_week)) {
      return pt.day_of_week === dateStr
    }
    if (hasDateSpecific) return false
    if (!pt.day_of_week) return true
    return dayNames[pt.day_of_week] === dayNum
  })
}

async function filterAndResolvePrayerTimes(prayerTimes: PrayerTimeRow[]) {
  const now = new Date()
  const nicosia = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Nicosia' }))
  const calendarDay = nicosia.getDay()
  const todayStr = nicosia.toLocaleDateString('en-CA')
  const currentTime = nicosia.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })

  // Today's zmanim
  const todayZmanim = await fetchZmanim(todayStr)
  const isHolyDay = isShabbatOrYomTov()
  const today = (isHolyDay && calendarDay === 5) ? 6 : calendarDay
  const todayDynamic = computeDynamicTimes(todayZmanim)

  // Filter today's times and remove past ones
  const todayTimes = filterByDay(prayerTimes, today, todayStr, isHolyDay, calendarDay)
    .map((pt) => ({
      ...pt,
      time: resolveDynamic(pt.time, todayDynamic),
      notes: cleanNotes(pt.notes),
      is_tomorrow: false,
    }))
    .filter((pt) => pt.time >= currentTime) // hide past times
    .sort((a, b) => a.time.localeCompare(b.time))

  // Tomorrow's info
  const tomorrowDate = new Date(nicosia)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowCalendarDay = tomorrowDate.getDay()
  const tomorrowStr = tomorrowDate.toLocaleDateString('en-CA')
  // For tomorrow, don't apply Shabbat shift or Friday hiding
  const tomorrowDayNum = tomorrowCalendarDay

  const tomorrowZmanim = await fetchZmanim(tomorrowStr)
  const tomorrowDynamic = computeDynamicTimes(tomorrowZmanim)
  // Saturday is always Shabbat (holy day) for filtering purposes
  const tomorrowIsHolyDay = tomorrowCalendarDay === 6

  // Restore today's zmanim cache for sync getters
  await fetchZmanim(todayStr)

  const tomorrowTimes = filterByDay(prayerTimes, tomorrowDayNum, tomorrowStr, tomorrowIsHolyDay, tomorrowCalendarDay)
    .map((pt) => ({
      ...pt,
      id: pt.id + 10000, // unique key to avoid React key conflicts
      time: resolveDynamic(pt.time, tomorrowDynamic),
      notes: cleanNotes(pt.notes),
      is_tomorrow: true,
    }))
    .sort((a, b) => a.time.localeCompare(b.time))

  return [...todayTimes, ...tomorrowTimes]
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
