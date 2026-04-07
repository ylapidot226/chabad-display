'use client'

import { useState, useEffect } from 'react'

export default function TopBar() {
  const [time, setTime] = useState('')
  const [hebrewDate, setHebrewDate] = useState('')
  const [gregDate, setGregDate] = useState('')

  useEffect(() => {
    function update() {
      const now = new Date()
      setTime(new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now))
      setHebrewDate(new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' }).format(now))
      setGregDate(new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }).format(now))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex-shrink-0 relative z-10">
      <div className="flex items-center justify-between h-[72px] px-8" style={{
        background: '#891738',
        boxShadow: '0 2px 20px rgba(137,23,56,0.15)',
      }}>
        {/* Right: Logo + Name */}
        <div className="flex items-center gap-4">
          <img
            src="https://chabadlimassol.com/wp-content/uploads/sites/112/2022/11/Chabad-Limassol-Logo.png"
            alt="Chabad Limassol"
            className="w-12 h-12 rounded-full"
            style={{ background: '#ffffff', padding: '3px' }}
          />
          <div>
            <div className="text-xl font-bold text-white tracking-wide">בית חב״ד לימסול</div>
            <div className="text-[11px] font-light text-white/50">Chabad of Limassol, Cyprus</div>
          </div>
        </div>

        {/* Center: Dates */}
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-medium text-white/70">{gregDate}</span>
          <span className="text-white/20">|</span>
          <span className="text-[14px] text-white/50">{hebrewDate}</span>
        </div>

        {/* Left: Clock */}
        <div className="text-4xl font-light tracking-tight text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {time}
        </div>
      </div>
    </div>
  )
}
