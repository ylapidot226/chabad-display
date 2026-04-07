'use client'

import { useState, useEffect } from 'react'
import type { PrayerTime } from '@/lib/types'
import { fetchZmanim, getMinchaTime, getTzeit, getSunset, getCandleLightingTime, isShabbatOrYomTov } from '@/lib/zmanim'

interface Props {
  prayerTimes: PrayerTime[]
}

const dayNames: Record<string, number> = {
  'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3, 'חמישי': 4, 'שישי': 5, 'שבת': 6
}

function getTodayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Nicosia' })
}

export default function PrayerTimesPanel({ prayerTimes }: Props) {
  const [dynamicTimes, setDynamicTimes] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function loadTimes() {
      // Fetch from Hebcal API (same data as chabad.org)
      await fetchZmanim()
      setDynamicTimes({
        mincha: getMinchaTime(),
        arvit: getTzeit(),
        sunset: getSunset(),
        candles: getCandleLightingTime(),
      })
      setLoaded(true)
    }
    loadTimes()
    // Refresh every hour
    const interval = setInterval(loadTimes, 3600000)
    return () => clearInterval(interval)
  }, [])

  const today = new Date().getDay()
  const todayStr = getTodayStr()

  const hasDateSpecific = prayerTimes.some((pt) =>
    pt.active && pt.day_of_week && /^\d{4}-\d{2}-\d{2}$/.test(pt.day_of_week) && pt.day_of_week === todayStr
  )

  const isHolyDay = loaded ? isShabbatOrYomTov() : false

  const activeTimes = prayerTimes
    .filter((pt) => {
      if (!pt.active) return false
      if (pt.notes?.includes('[WEEKDAY_ONLY]') && isHolyDay) return false

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
      const notes = pt.notes?.replace('[WEEKDAY_ONLY]', '').trim() || null
      return { ...pt, time, notes }
    })
    .sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div style={{
      background: '#fff',
      borderTop: '1px solid rgba(0,0,0,0.05)',
    }}>
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <div className="w-1 h-4 rounded-full" style={{ background: '#891738' }} />
        <span className="text-sm font-bold" style={{ color: '#891738' }}>זמני תפילות</span>
      </div>

      <div className="px-4 pb-4 space-y-1">
        {activeTimes.map((pt, i) => (
          <div key={pt.id} className="flex justify-between items-center py-2.5 px-3 rounded-lg"
            style={{ background: i % 2 === 0 ? 'rgba(137,23,56,0.03)' : 'transparent' }}>
            <div>
              <span className="text-[14px] font-medium" style={{ color: '#555' }}>{pt.name}</span>
              {pt.notes && (
                <span className="text-[11px] mr-2" style={{ color: '#999' }}> ({pt.notes})</span>
              )}
            </div>
            <span className="text-[16px] font-bold" style={{ color: '#891738', fontVariantNumeric: 'tabular-nums' }}>{pt.time}</span>
          </div>
        ))}

        {activeTimes.length === 0 && (
          <p className="text-xs py-3 text-center" style={{ color: '#bbb' }}>
            אין זמני תפילות להיום
          </p>
        )}
      </div>
    </div>
  )
}
