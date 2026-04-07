'use client'

import type { Announcement } from '@/lib/types'

interface Props {
  announcements: Announcement[]
  tickerSpeed: number
}

export default function BottomBar({ announcements, tickerSpeed }: Props) {
  const activeAnnouncements = announcements.filter((a) => {
    const now = new Date()
    if (!a.active) return false
    if (a.ends_at && new Date(a.ends_at) < now) return false
    return true
  })

  if (activeAnnouncements.length === 0) return null

  const separator = '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0◈\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'
  const text = activeAnnouncements
    .sort((a, b) => b.priority - a.priority)
    .map((a) => a.text)
    .join(separator)

  return (
    <div className="flex-shrink-0 relative z-10">
      <div className="h-11 flex items-center overflow-hidden relative" style={{
        background: '#fff',
        borderTop: '1px solid rgba(0,0,0,0.05)',
      }}>
        {/* Gold accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
          background: 'linear-gradient(90deg, #891738, #ffb400, #891738)',
        }} />

        {/* Fade edges */}
        <div className="absolute inset-y-0 right-0 w-20 z-10" style={{ background: 'linear-gradient(to left, #fff, transparent)' }} />
        <div className="absolute inset-y-0 left-0 w-20 z-10" style={{ background: 'linear-gradient(to right, #fff, transparent)' }} />

        <div
          className="ticker-animate whitespace-nowrap text-[14px] font-medium"
          style={{
            '--ticker-duration': `${tickerSpeed}s`,
            color: '#555',
          } as React.CSSProperties}
        >
          {text}{separator}{text}
        </div>
      </div>
    </div>
  )
}
