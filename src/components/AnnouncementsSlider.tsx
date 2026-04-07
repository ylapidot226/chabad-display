'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MediaItem, Announcement } from '@/lib/types'

interface Props {
  items: MediaItem[]
  announcements: Announcement[]
  slideDuration: number
}

export default function AnnouncementsSlider({ items, announcements, slideDuration }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const textAnnouncements = announcements.filter((a) => {
    const now = new Date()
    if (!a.active) return false
    if (a.ends_at && new Date(a.ends_at) < now) return false
    return true
  })

  const totalSlides = items.length + textAnnouncements.length

  const goToNext = useCallback(() => {
    if (totalSlides <= 1) return
    setIsVisible(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides)
      setIsVisible(true)
    }, 500)
  }, [totalSlides])

  useEffect(() => {
    if (totalSlides === 0) return
    const timer = setTimeout(goToNext, slideDuration * 1000)
    return () => clearTimeout(timer)
  }, [currentIndex, totalSlides, slideDuration, goToNext])

  if (totalSlides === 0) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: '#f8f7f4' }}>
        <p className="text-sm" style={{ color: '#bbb' }}>מודעות ופעילויות יופיעו כאן</p>
      </div>
    )
  }

  const isImage = currentIndex < items.length
  const currentImage = isImage ? items[currentIndex] : null
  const currentText = !isImage ? textAnnouncements[currentIndex - items.length] : null

  return (
    <div className="h-full relative overflow-hidden" style={{ background: '#f8f7f4' }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full" style={{ background: '#ffb400' }} />
          <span className="text-xs font-semibold tracking-wider" style={{ color: '#891738' }}>
            פעילויות
          </span>
        </div>
        {totalSlides > 1 && (
          <div className="flex gap-1">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <div key={i} className="h-[3px] rounded-full transition-all duration-300" style={{
                width: i === currentIndex ? '18px' : '6px',
                background: i === currentIndex ? '#891738' : 'rgba(137,23,56,0.15)',
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="absolute inset-0 pt-12" style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {isImage && currentImage ? (
          <div className="h-full p-4 pt-0">
            <img
              src={currentImage.url}
              alt={currentImage.title || ''}
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
        ) : currentText ? (
          <div className="h-full flex items-center px-7">
            <div className="card p-6 w-full" style={{ borderRight: '3px solid #891738' }}>
              <p className="text-xl font-semibold leading-relaxed" style={{ color: '#1a1a1a' }}>
                {currentText.text}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
