'use client'

import { useState, useEffect } from 'react'

var hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
var hebrewMonths = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

function pad(n: number): string {
  return n < 10 ? '0' + n : '' + n
}

function getTime(): string {
  var now = new Date()
  return pad(now.getHours()) + ':' + pad(now.getMinutes())
}

function getGregDate(): string {
  var now = new Date()
  var dayName = 'יום ' + hebrewDays[now.getDay()]
  return dayName + ', ' + now.getDate() + ' ב' + hebrewMonths[now.getMonth()]
}

function getHebrewDate(): string {
  try {
    var now = new Date()
    // Try Intl first
    var formatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' })
    return formatter.format(now)
  } catch (e) {
    // Fallback - just return empty
    return ''
  }
}

export default function TopBar() {
  var [time, setTime] = useState(getTime())
  var [gregDate, setGregDate] = useState(getGregDate())
  var [hebrewDate, setHebrewDate] = useState('')

  useEffect(function() {
    // Set hebrew date after mount (might fail on some browsers)
    setHebrewDate(getHebrewDate())

    function update() {
      setTime(getTime())
      setGregDate(getGregDate())
    }
    var interval = setInterval(update, 1000)
    return function() { clearInterval(interval) }
  }, [])

  return (
    <div style={{
      flexShrink: 0, position: 'relative', zIndex: 10,
    }}>
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
          <span style={{ fontSize: '18px', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>{gregDate}</span>
          {hebrewDate && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.55)' }}>{hebrewDate}</span>
            </>
          )}
        </div>

        {/* Left: Clock */}
        <div style={{ fontSize: '48px', fontWeight: 300, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
          {time}
        </div>
      </div>
    </div>
  )
}
