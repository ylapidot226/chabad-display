// Zmanim from Hebcal API - same times as chabad.org
// Limassol, Cyprus - geonameid: 146384

const GEONAME_ID = 146384

interface ZmanimTimes {
  sunset: string
  tzeit85deg: string
  candles: string  // 18 min before sunset
  minchaKetana: string
  [key: string]: string
}

let cachedTimes: { date: string; times: ZmanimTimes } | null = null

function getTodayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Nicosia' })
}

function extractTime(isoString: string): string {
  // "2026-04-07T19:14:00+03:00" -> "19:14"
  const match = isoString.match(/T(\d{2}:\d{2})/)
  return match ? match[1] : '--:--'
}

function subtractMinutes(isoString: string, minutes: number): string {
  const date = new Date(isoString)
  date.setMinutes(date.getMinutes() - minutes)
  return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Nicosia' })
}

export async function fetchZmanim(dateStr?: string): Promise<ZmanimTimes> {
  const date = dateStr || getTodayStr()

  // Return cache if same day
  if (cachedTimes && cachedTimes.date === date) {
    return cachedTimes.times
  }

  try {
    const res = await fetch(`https://www.hebcal.com/zmanim?cfg=json&geonameid=${GEONAME_ID}&date=${date}`)
    const data = await res.json()
    const t = data.times

    const times: ZmanimTimes = {
      sunset: extractTime(t.sunset),
      tzeit85deg: extractTime(t.tzeit85deg),
      candles: subtractMinutes(t.sunset, 18),
      minchaKetana: extractTime(t.minchaKetana),
      alotHaShachar: extractTime(t.alotHaShachar),
      sunrise: extractTime(t.sunrise),
      chatzot: extractTime(t.chatzot),
      minchaGedola: extractTime(t.minchaGedola),
      plagHaMincha: extractTime(t.plagHaMincha),
      beinHaShmashos: extractTime(t.beinHaShmashos),
    }

    cachedTimes = { date, times }
    return times
  } catch {
    // Fallback if API fails
    return {
      sunset: '--:--',
      tzeit85deg: '--:--',
      candles: '--:--',
      minchaKetana: '--:--',
    }
  }
}

// Sync versions using cached data
export function getSunset(): string { return cachedTimes?.times.sunset || '--:--' }
export function getTzeit(): string { return cachedTimes?.times.tzeit85deg || '--:--' }
export function getCandleLightingTime(): string { return cachedTimes?.times.candles || '--:--' }

export function getMinchaTime(): string {
  if (!cachedTimes) return '--:--'
  // 15 min before sunset
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
  const nicosia = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Nicosia' }))
  const day = nicosia.getDay()
  const timeStr = nicosia.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })

  // Friday after candle lighting
  if (day === 5 && cachedTimes) {
    if (timeStr >= cachedTimes.times.candles) return true
  }
  // Saturday before tzeit
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
    const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Nicosia' })
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
