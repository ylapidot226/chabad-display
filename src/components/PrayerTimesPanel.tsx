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

  useEffect(function() {
    function loadTimes() {
      fetchZmanim().then(function() {
        setDynamicTimes({
          mincha: getMinchaTime(),
          arvit: getTzeit(),
          sunset: getSunset(),
          candles: getCandleLightingTime(),
        })
        setLoaded(true)
      }).catch(function() { setLoaded(true) })
    }
    loadTimes()
    var interval = setInterval(loadTimes, 3600000)
    return function() { clearInterval(interval) }
  }, [])

  var today = new Date().getDay()
  var todayStr = getTodayStr()

  var hasDateSpecific = prayerTimes.some(function(pt) {
    return pt.active && pt.day_of_week && /^\d{4}-\d{2}-\d{2}$/.test(pt.day_of_week) && pt.day_of_week === todayStr
  })

  var isHolyDay = loaded ? isShabbatOrYomTov() : false

  var activeTimes = prayerTimes
    .filter(function(pt) {
      if (!pt.active) return false
      if (pt.notes && pt.notes.indexOf('[WEEKDAY_ONLY]') !== -1 && isHolyDay) return false

      if (pt.day_of_week && /^\d{4}-\d{2}-\d{2}$/.test(pt.day_of_week)) {
        return pt.day_of_week === todayStr
      }

      if (hasDateSpecific) return false

      if (!pt.day_of_week) return true
      return dayNames[pt.day_of_week] === today
    })
    .map(function(pt) {
      var time = pt.time
      if (time === 'dynamic:mincha') time = dynamicTimes.mincha || '--:--'
      else if (time === 'dynamic:arvit') time = dynamicTimes.arvit || '--:--'
      else if (time === 'dynamic:sunset') time = dynamicTimes.sunset || '--:--'
      else if (time === 'dynamic:candles') time = dynamicTimes.candles || '--:--'
      var notes = pt.notes ? pt.notes.replace('[WEEKDAY_ONLY]', '').trim() : null
      if (notes === '') notes = null
      return { id: pt.id, name: pt.name, time: time, notes: notes, sort_order: pt.sort_order, active: pt.active, day_of_week: pt.day_of_week, created_at: pt.created_at }
    })
    .sort(function(a, b) { return a.time.localeCompare(b.time) })

  return (
    <div className="h-full flex flex-col" style={{
      background: '#fff',
      borderTop: '1px solid rgba(0,0,0,0.05)',
    }}>
      <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center gap-2">
        <div className="rounded-full" style={{ width: '4px', height: '20px', background: '#891738' }} />
        <span className="font-bold" style={{ fontSize: '20px', color: '#891738' }}>זמני תפילות</span>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-4" style={{ minHeight: 0 }}>
        {activeTimes.map(function(pt, i) {
          return (
            <div key={pt.id} className="flex justify-between items-center rounded-lg"
              style={{
                padding: '12px 16px',
                marginBottom: '4px',
                background: i % 2 === 0 ? 'rgba(137,23,56,0.04)' : 'transparent',
              }}>
              <div>
                <span className="font-medium" style={{ fontSize: '18px', color: '#444' }}>{pt.name}</span>
                {pt.notes && (
                  <span className="mr-2" style={{ fontSize: '14px', color: '#999' }}> ({pt.notes})</span>
                )}
              </div>
              <span className="font-bold" style={{ fontSize: '22px', color: '#891738', fontVariantNumeric: 'tabular-nums' }}>{pt.time}</span>
            </div>
          )
        })}

        {activeTimes.length === 0 && (
          <p className="py-4 text-center" style={{ fontSize: '14px', color: '#bbb' }}>
            אין זמני תפילות להיום
          </p>
        )}
      </div>
    </div>
  )
}
