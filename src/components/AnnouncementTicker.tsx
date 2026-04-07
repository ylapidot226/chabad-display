'use client'

import type { Announcement } from '@/lib/types'

interface Props {
  announcements: Announcement[]
  speed: number
}

export default function AnnouncementTicker({ announcements, speed }: Props) {
  const activeAnnouncements = announcements.filter((a) => {
    const now = new Date()
    if (!a.active) return false
    if (a.ends_at && new Date(a.ends_at) < now) return false
    return true
  })

  if (activeAnnouncements.length === 0) return null

  const separator = '        ✦        '
  const text = activeAnnouncements
    .sort((a, b) => b.priority - a.priority)
    .map((a) => a.text)
    .join(separator)

  return (
    <div className="py-3.5 overflow-hidden relative" style={{
      background: 'linear-gradient(90deg, #891738 0%, #a01d45 50%, #891738 100%)',
    }}>
      {/* Fade edges */}
      <div className="absolute inset-y-0 right-0 w-16 z-10" style={{ background: 'linear-gradient(to left, #891738, transparent)' }} />
      <div className="absolute inset-y-0 left-0 w-16 z-10" style={{ background: 'linear-gradient(to right, #891738, transparent)' }} />

      <div
        className="ticker-animate whitespace-nowrap text-xl font-medium tracking-wide"
        style={{ '--ticker-duration': `${speed}s` } as React.CSSProperties}
      >
        {text}{separator}{text}
      </div>
    </div>
  )
}
