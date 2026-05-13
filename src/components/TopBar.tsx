'use client'

import { useState, useEffect } from 'react'

// Cyprus (Nicosia) timezone offset:
// EEST (summer, last Sun Mar → last Sun Oct): UTC+3
// EET  (winter): UTC+2
function getNicosiaDate(): Date {
  var now = new Date()
  var utcMs = now.getTime() + now.getTimezoneOffset() * 60000
  // Determine DST: last Sunday in March → last Sunday in October
  var y = now.getUTCFullYear()
  function lastSunday(month: number) {
    // Find last Sunday of given month (0-based) in year y
    var d = new Date(Date.UTC(y, month + 1, 0)) // last day of month
    d.setUTCDate(d.getUTCDate() - d.getUTCDay()) // go back to Sunday
    return d.getTime()
  }
  var dstStart = lastSunday(2)  // last Sunday of March
  var dstEnd   = lastSunday(9)  // last Sunday of October
  var offset   = (utcMs >= dstStart && utcMs < dstEnd) ? 3 : 2
  return new Date(utcMs + offset * 3600000)
}

var hebrewDays   = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
var hebrewMonths = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
                    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

function pad(n: number) { return n < 10 ? '0' + n : '' + n }

function getTime(): string {
  var d = getNicosiaDate()
  return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes())
}

function getGregDate(): string {
  var d = getNicosiaDate()
  return 'יום ' + hebrewDays[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ב' + hebrewMonths[d.getUTCMonth()]
}

function getHebrewDate(): string {
  try {
    var formatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
      day: 'numeric', month: 'long', year: 'numeric',
      timeZone: 'Asia/Nicosia',
    })
    return formatter.format(new Date())
  } catch (_) { return '' }
}

export default function TopBar() {
  var [time, setTime]           = useState('')
  var [gregDate, setGregDate]   = useState('')
  var [hebrewDate, setHebrewDate] = useState('')

  useEffect(function () {
    // Set initial values
    setTime(getTime())
    setGregDate(getGregDate())
    setHebrewDate(getHebrewDate())

    // requestAnimationFrame loop — not throttled by TV browsers like setInterval
    var rafId = 0
    var lastMinute = -1

    function tick() {
      var d = getNicosiaDate()
      var m = d.getUTCMinutes()
      if (m !== lastMinute) {
        lastMinute = m
        setTime(pad(d.getUTCHours()) + ':' + pad(m))
        setGregDate(getGregDate())
      }
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return function () { cancelAnimationFrame(rafId) }
  }, [])

  return (
    <div style={{ flexShrink: 0, position: 'relative', zIndex: 10 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '80px', paddingLeft: '32px', paddingRight: '32px',
        background: '#891738',
        boxShadow: '0 2px 20px rgba(137,23,56,0.15)',
      }}>
        {/* Right: Logo + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src="https://chabadlimassol.com/wp-content/uploads/sites/112/2022/11/Chabad-Limassol-Logo.png"
            alt="Chabad Limassol"
            style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#fff', padding: '3px' }}
          />
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', letterSpacing: '0.5px' }}>בית חב״ד לימסול</div>
            <div style={{ fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.5)' }}>Chabad of Limassol, Cyprus</div>
          </div>
        </div>

        {/* Center: Dates */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {gregDate && (
            <span style={{ fontSize: '18px', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>{gregDate}</span>
          )}
          {hebrewDate && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.55)' }}>{hebrewDate}</span>
            </>
          )}
        </div>

        {/* Left: Clock */}
        <div style={{ fontSize: '48px', fontWeight: 300, color: '#fff', fontVariantNumeric: 'tabular-nums', minWidth: '120px', textAlign: 'left' }}>
          {time || '--:--'}
        </div>
      </div>
    </div>
  )
}
