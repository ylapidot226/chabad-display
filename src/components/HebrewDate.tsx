'use client'

import { useState, useEffect } from 'react'

export default function HebrewDate() {
  const [dateStr, setDateStr] = useState('')
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    function update() {
      const now = new Date()

      const hebrewDate = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now)

      const gregDate = new Intl.DateTimeFormat('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now)

      setDateStr(`${gregDate}  •  ${hebrewDate}`)

      setTimeStr(
        new Intl.DateTimeFormat('he-IL', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now)
      )
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="px-8 py-4 flex justify-between items-center" style={{
      background: 'linear-gradient(135deg, #891738 0%, #6b1230 100%)',
    }}>
      <span className="text-lg font-medium tracking-wide opacity-90">{dateStr}</span>
      <span className="text-4xl font-bold tracking-tight" style={{ color: '#ffb400' }}>{timeStr}</span>
    </div>
  )
}
