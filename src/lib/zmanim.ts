// Zmanim calculated locally via kosher-zmanim (no external API dependency)
// Limassol, Cyprus: 34.6823°N, 33.0464°E

import { getZmanimJson } from 'kosher-zmanim'

const LAT = 34.6823
const LON = 33.0464
const ELEVATION = 10
const TZ = 'Asia/Nicosia'

interface ZmanimTimes {
  sunset: string
  tzeit85deg: string
  candles: string
  minchaKetana: string
  alotHaShachar: string
  sunrise: string
  chatzot: string
  minchaGedola: string
  plagHaMincha: string
  beinHaShmashos: string
  [key: string]: string
}

let cachedTimes: { date: string; times: ZmanimTimes } | null = null

function getTodayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ })
}

function extractTime(isoString: string | undefined | null): string {
  if (!isoString || typeof isoString !== 'string') return '--:--'
  const match = isoString.match(/T(\d{2}:\d{2})/)
  return match ? match[1] : '--:--'
}

export async function fetchZmanim(dateStr?: string): Promise<ZmanimTimes> {
  const date = dateStr || getTodayStr()

  if (cachedTimes && cachedTimes.date === date) {
    return cachedTimes.times
  }

  try {
    const result = getZmanimJson({
      date: new Date(date + 'T12:00:00'),
      timeZoneId: TZ,
      latitude: LAT,
      longitude: LON,
      elevation: ELEVATION,
    })

    const z = (result.BasicZmanim || {}) as Record<string, string>

    const times: ZmanimTimes = {
      sunset: extractTime(z.Sunset),
      tzeit85deg: extractTime(z.Tzais),
      candles: extractTime(z.CandleLighting),
      minchaKetana: extractTime(z.MinchaKetana),
      alotHaShachar: extractTime(z.AlosHashachar),
      sunrise: extractTime(z.Sunrise),
      chatzot: extractTime(z.Chatzos),
      minchaGedola: extractTime(z.MinchaGedola),
      plagHaMincha: extractTime(z.PlagHamincha),
      beinHaShmashos: extractTime(z.Tzais),
    }

    cachedTimes = { date, times }
    return times
  } catch {
    return {
      sunset: '--:--',
      tzeit85deg: '--:--',
      candles: '--:--',
      minchaKetana: '--:--',
      alotHaShachar: '--:--',
      sunrise: '--:--',
      chatzot: '--:--',
      minchaGedola: '--:--',
      plagHaMincha: '--:--',
      beinHaShmashos: '--:--',
    }
  }
}

// Sync versions using cached data
export function getSunset(): string { return cachedTimes?.times.sunset || '--:--' }
export function getTzeit(): string { return cachedTimes?.times.tzeit85deg || '--:--' }
export function getCandleLightingTime(): string { return cachedTimes?.times.candles || '--:--' }

export function getMinchaTime(): string {
  if (!cachedTimes) return '--:--'
  const sunset = cachedTimes.times.sunset
  const [h, m] = sunset.split(':').map(Number)
  const totalMin = h * 60 + m - 15
  const hh = Math.floor(totalMin / 60).toString().padStart(2, '0')
  const mm = (totalMin % 60).toString().padStart(2, '0')
  return `${hh}:${mm}`
}

// Shabbat / Yom Tov detection
export function isShabbat(): boolean {
  const now = new Date()
  const nicosia = new Date(now.toLocaleString('en-US', { timeZone: TZ }))
  const day = nicosia.getDay()
  const timeStr = nicosia.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })

  if (day === 5) return true
  if (day === 6 && cachedTimes) {
    if (timeStr < cachedTimes.times.tzeit85deg) return true
  }
  return false
}

// Major Jewish holidays (Yom Tov) - Diaspora dates
const YOM_TOV_DATES: string[] = [
  '2026-04-02', '2026-04-03', '2026-04-08', '2026-04-09', // Pesach 5786
  '2026-05-22', '2026-05-23', // Shavuot
  '2026-09-12', '2026-09-13', // Rosh Hashana 5787
  '2026-09-21', // Yom Kippur
  '2026-09-26', '2026-09-27', // Sukkot
  '2026-10-03', '2026-10-04', // Shmini Atzeret
]
const EREV_YOM_TOV: string[] = [
  '2026-04-01', '2026-04-07', '2026-05-21', '2026-09-11',
  '2026-09-20', '2026-09-25', '2026-10-02',
]

export function isYomTov(): boolean {
  const dateStr = getTodayStr()
  if (YOM_TOV_DATES.includes(dateStr)) return true

  if (EREV_YOM_TOV.includes(dateStr) && cachedTimes) {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ })
    if (timeStr >= cachedTimes.times.sunset) return true
  }
  return false
}

export function isShabbatOrYomTov(): boolean {
  return isShabbat() || isYomTov()
}

export function getGreeting(): string | null {
  if (isYomTov()) return 'חג שמח!'
  if (isShabbat()) return 'שבת שלום!'
  return null
}
