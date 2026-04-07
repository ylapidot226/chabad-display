'use client'

import type { PrayerTime } from '@/lib/types'

interface Props {
  prayerTimes: PrayerTime[]
}

const dayNames: Record<string, number> = {
  'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3, 'חמישי': 4, 'שישי': 5, 'שבת': 6
}

export default function PrayerTimesPanel({ prayerTimes }: Props) {
  const today = new Date().getDay()

  const activeTimes = prayerTimes
    .filter((pt) => {
      if (!pt.active) return false
      if (!pt.day_of_week) return true
      return dayNames[pt.day_of_week] === today
    })
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div style={{
      background: '#fff',
      borderTop: '1px solid rgba(0,0,0,0.05)',
    }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <div className="w-1 h-4 rounded-full" style={{ background: '#891738' }} />
        <span className="text-sm font-bold" style={{ color: '#891738' }}>זמני תפילות</span>
      </div>

      {/* Times */}
      <div className="px-4 pb-4 space-y-1">
        {activeTimes.map((pt, i) => (
          <div key={pt.id} className="flex justify-between items-center py-2.5 px-3 rounded-lg"
            style={{ background: i % 2 === 0 ? 'rgba(137,23,56,0.03)' : 'transparent' }}>
            <span className="text-[14px] font-medium" style={{ color: '#555' }}>{pt.name}</span>
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
