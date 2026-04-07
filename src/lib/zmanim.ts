// Limassol, Cyprus coordinates
const LIMASSOL_LAT = 34.6823
const LIMASSOL_LNG = 33.0464

// Calculate solar times using astronomical formulas
// This avoids dependency issues with kosher-zmanim on client-side

function toRad(deg: number): number { return deg * Math.PI / 180 }
function toDeg(rad: number): number { return rad * 180 / Math.PI }

function calcSunTime(date: Date, lat: number, lng: number, zenith: number, isSunrise: boolean): Date {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)

  // Sun's approximate position
  const lngHour = lng / 15
  const t = isSunrise
    ? dayOfYear + ((6 - lngHour) / 24)
    : dayOfYear + ((18 - lngHour) / 24)

  // Sun's mean anomaly
  const M = (0.9856 * t) - 3.289

  // Sun's true longitude
  let L = M + (1.916 * Math.sin(toRad(M))) + (0.020 * Math.sin(toRad(2 * M))) + 282.634
  L = ((L % 360) + 360) % 360

  // Sun's right ascension
  let RA = toDeg(Math.atan(0.91764 * Math.tan(toRad(L))))
  RA = ((RA % 360) + 360) % 360

  const lQuad = Math.floor(L / 90) * 90
  const raQuad = Math.floor(RA / 90) * 90
  RA = RA + (lQuad - raQuad)
  RA = RA / 15

  // Sun's declination
  const sinDec = 0.39782 * Math.sin(toRad(L))
  const cosDec = Math.cos(Math.asin(sinDec))

  // Hour angle
  const cosH = (Math.cos(toRad(zenith)) - (sinDec * Math.sin(toRad(lat)))) / (cosDec * Math.cos(toRad(lat)))
  if (cosH > 1 || cosH < -1) return date // no sunrise/sunset

  let H = isSunrise
    ? 360 - toDeg(Math.acos(cosH))
    : toDeg(Math.acos(cosH))
  H = H / 15

  // Local mean time
  const T = H + RA - (0.06571 * t) - 6.622

  // UTC time
  let UT = ((T - lngHour) % 24 + 24) % 24

  const result = new Date(date)
  result.setUTCHours(Math.floor(UT), Math.round((UT % 1) * 60), 0, 0)
  return result
}

function getSunsetDate(date?: Date): Date {
  const d = date || new Date()
  return calcSunTime(d, LIMASSOL_LAT, LIMASSOL_LNG, 90.833, false)
}

function getTzeitDate(date?: Date): Date {
  const d = date || new Date()
  // Tzeit hakochavim: 8.5 degrees below horizon
  return calcSunTime(d, LIMASSOL_LAT, LIMASSOL_LNG, 98.5, false)
}

function formatLocalTime(d: Date): string {
  return d.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Nicosia',
  })
}

export function getSunset(date?: Date): string {
  return formatLocalTime(getSunsetDate(date))
}

export function getTzeit(date?: Date): string {
  return formatLocalTime(getTzeitDate(date))
}

export function getMinchaTime(date?: Date): string {
  const sunset = getSunsetDate(date)
  const mincha = new Date(sunset.getTime() - 15 * 60 * 1000)
  return formatLocalTime(mincha)
}

export function isShabbat(date?: Date): boolean {
  const now = date || new Date()
  const day = now.getDay()

  if (day === 5) {
    const sunset = getSunsetDate(now)
    if (now >= sunset) return true
  }

  if (day === 6) {
    const tzeit = getTzeitDate(now)
    if (now < tzeit) return true
  }

  return false
}

// Major Jewish holidays (Yom Tov) - Diaspora dates
const YOM_TOV_DATES: string[] = [
  // Pesach 5786
  '2026-04-02', '2026-04-03', // 1st/2nd
  '2026-04-08', '2026-04-09', // 7th/8th
  // Shavuot 5786
  '2026-05-22', '2026-05-23',
  // Rosh Hashana 5787
  '2026-09-12', '2026-09-13',
  // Yom Kippur 5787
  '2026-09-21',
  // Sukkot 5787
  '2026-09-26', '2026-09-27',
  // Shmini Atzeret / Simchat Torah 5787
  '2026-10-03', '2026-10-04',
]

// Erev dates (day before Yom Tov - Shabbat mode starts at sunset)
const EREV_YOM_TOV: string[] = [
  '2026-04-01', '2026-04-07',
  '2026-05-21',
  '2026-09-11',
  '2026-09-20',
  '2026-09-25',
  '2026-10-02',
]

export function isYomTov(date?: Date): boolean {
  const now = date || new Date()
  // Format date in local timezone
  const localDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Nicosia' }))
  const dateStr = localDate.toISOString().split('T')[0]

  if (YOM_TOV_DATES.includes(dateStr)) return true

  // Erev Yom Tov after sunset
  if (EREV_YOM_TOV.includes(dateStr)) {
    const sunset = getSunsetDate(now)
    if (now >= sunset) return true
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
