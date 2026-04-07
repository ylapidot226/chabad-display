'use client'

import { useState, useEffect } from 'react'

export default function TopBar() {
  const [time, setTime] = useState('')
  const [hebrewDate, setHebrewDate] = useState('')
  const [gregDate, setGregDate] = useState('')

  useEffect(function() {
    function update() {
      var now = new Date()
      setTime(new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now))
      setHebrewDate(new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' }).format(now))
      setGregDate(new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }).format(now))
    }
    update()
    var interval = setInterval(update, 1000)
    return function() { clearInterval(interval) }
  }, [])

  return (
    <div className="flex-shrink-0 relative z-10">
      <div className="flex items-center justify-between px-10" style={{
        height: '80px',
        background: '#891738',
        boxShadow: '0 2px 20px rgba(137,23,56,0.15)',
      }}>
        {/* Right: Logo + Name */}
        <div className="flex items-center gap-4">
          <img
            src="https://chabadlimassol.com/wp-content/uploads/sites/112/2022/11/Chabad-Limassol-Logo.png"
            alt="Chabad Limassol"
            className="rounded-full"
            style={{ width: '54px', height: '54px', background: '#ffffff', padding: '3px' }}
          />
          <div>
            <div className="font-bold text-white tracking-wide" style={{ fontSize: '24px' }}>בית חב״ד לימסול</div>
            <div className="font-light" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Chabad of Limassol, Cyprus</div>
          </div>
        </div>

        {/* Center: Dates */}
        <div className="flex items-center gap-3">
          <span className="font-medium" style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)' }}>{gregDate}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.55)' }}>{hebrewDate}</span>
        </div>

        {/* Left: Clock */}
        <div className="font-light tracking-tight text-white" style={{ fontSize: '48px', fontVariantNumeric: 'tabular-nums' }}>
          {time}
        </div>
      </div>
    </div>
  )
}
