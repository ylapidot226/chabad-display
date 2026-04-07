'use client'

import { useState, useEffect } from 'react'
import type { PrayerTime } from '@/lib/types'
import { fetchZmanim, getMinchaTime, getTzeit, getSunset, getCandleLightingTime, isShabbatOrYomTov } from '@/lib/zmanim'

interface Props {
  prayerTimes: PrayerTime[]
}

var dayNames: Record<string, number> = {
  'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3, 'חמישי': 4, 'שישי': 5, 'שבת': 6
}

function getTodayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Nicosia' })
}

export default function PrayerTimesPanel({ prayerTimes }: Props) {
  var [dynamicTimes, setDynamicTimes] = useState<Record<string, string>>({})
  var [loaded, setLoaded] = useState(false)

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
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: '#fff',
      borderTop: '1px solid rgba(0,0,0,0.05)',
    }}>
      <div style={{
        flexShrink: 0, padding: '16px 20px 8px 20px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <div style={{ width: '4px', height: '20px', borderRadius: '4px', background: '#891738' }} />
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#891738' }}>זמני תפילות</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px 16px', minHeight: 0 }}>
        {activeTimes.map(function(pt, i) {
          return (
            <div key={pt.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', marginBottom: '4px', borderRadius: '8px',
              background: i % 2 === 0 ? 'rgba(137,23,56,0.04)' : 'transparent',
            }}>
              <div>
                <span style={{ fontSize: '17px', fontWeight: 500, color: '#444' }}>{pt.name}</span>
                {pt.notes && (
                  <span style={{ fontSize: '13px', color: '#999', marginRight: '8px' }}> ({pt.notes})</span>
                )}
              </div>
              <span style={{ fontSize: '21px', fontWeight: 'bold', color: '#891738', fontVariantNumeric: 'tabular-nums' }}>{pt.time}</span>
            </div>
          )
        })}

        {activeTimes.length === 0 && (
          <p style={{ fontSize: '14px', color: '#bbb', textAlign: 'center', padding: '16px 0' }}>
            אין זמני תפילות להיום
          </p>
        )}
      </div>
    </div>
  )
}
