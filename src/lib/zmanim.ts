import { ZmanimCalendar, GeoLocation } from 'kosher-zmanim'

// Limassol, Cyprus coordinates
const LIMASSOL_LAT = 34.6823
const LIMASSOL_LNG = 33.0464
const LIMASSOL_TZ = 'Asia/Nicosia'

function getCalendar(date?: Date): ZmanimCalendar {
  const geo = new GeoLocation('Limassol', LIMASSOL_LAT, LIMASSOL_LNG, 0, LIMASSOL_TZ)
  const cal = new ZmanimCalendar(geo)
  if (date) cal.setDate(date)
  return cal
}

function formatTime(dt: { toFormat: (fmt: string) => string } | null): string {
  if (!dt) return '--:--'
  return dt.toFormat('HH:mm')
}

export function getSunset(date?: Date): string {
  const cal = getCalendar(date)
  return formatTime(cal.getSunset())
}

export function getSunsetDate(date?: Date): Date | null {
  const cal = getCalendar(date)
  const sunset = cal.getSunset()
  return sunset ? sunset.toJSDate() : null
}

export function getTzeit(date?: Date): string {
  const cal = getCalendar(date)
  return formatTime(cal.getTzais())
}

export function getTzeitDate(date?: Date): Date | null {
  const cal = getCalendar(date)
  const tzeit = cal.getTzais()
  return tzeit ? tzeit.toJSDate() : null
}

export function getMinchaTime(date?: Date): string {
  const cal = getCalendar(date)
  const sunset = cal.getSunset()
  if (!sunset) return '--:--'
  const mincha = sunset.minus({ minutes: 15 })
  return mincha.toFormat('HH:mm')
}

export function isShabbat(date?: Date): boolean {
  const now = date || new Date()
  const day = now.getDay()

  // Friday after sunset
  if (day === 5) {
    const sunsetDate = getSunsetDate(now)
    if (sunsetDate && now >= sunsetDate) return true
  }

  // Saturday before tzeit
  if (day === 6) {
    const tzeitDate = getTzeitDate(now)
    if (tzeitDate && now < tzeitDate) return true
  }

  return false
}

// Major Jewish holidays (Yom Tov) - dates for 5785/5786
// These need to be updated yearly or computed from Hebrew calendar
const YOM_TOV_DATES: string[] = [
  // Pesach 5785
  '2025-04-13', '2025-04-14', // 1st/2nd night+day
  '2025-04-19', '2025-04-20', // 7th/8th
  // Shavuot 5785
  '2025-06-02', '2025-06-03',
  // Rosh Hashana 5786
  '2025-09-23', '2025-09-24',
  // Yom Kippur 5786
  '2025-10-02',
  // Sukkot 5786
  '2025-10-07', '2025-10-08',
  // Shmini Atzeret / Simchat Torah 5786
  '2025-10-14', '2025-10-15',
  // Pesach 5786
  '2026-04-02', '2026-04-03',
  '2026-04-08', '2026-04-09',
  // Shavuot 5786
  '2026-05-22', '2026-05-23',
]

export function isYomTov(date?: Date): boolean {
  const now = date || new Date()
  const dateStr = now.toISOString().split('T')[0]

  // Check if today is a Yom Tov date
  if (YOM_TOV_DATES.includes(dateStr)) return true

  // Also check if it's erev Yom Tov after sunset
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  if (YOM_TOV_DATES.includes(tomorrowStr)) {
    const sunsetDate = getSunsetDate(now)
    if (sunsetDate && now >= sunsetDate) return true
  }

  return false
}

export function isShabbatOrYomTov(date?: Date): boolean {
  return isShabbat(date) || isYomTov(date)
}

export function getGreeting(date?: Date): string | null {
  const now = date || new Date()
  if (isYomTov(now)) return 'חג שמח!'
  if (isShabbat(now)) return 'שבת שלום!'
  return null
}
