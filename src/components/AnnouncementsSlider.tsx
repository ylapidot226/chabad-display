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

  var textAnnouncements = announcements.filter(function(a) {
    var now = new Date()
    if (!a.active) return false
    if (a.ends_at && new Date(a.ends_at) < now) return false
    return true
  })

  var totalSlides = items.length + textAnnouncements.length

  var goToNext = useCallback(function() {
    if (totalSlides <= 1) return
    setIsVisible(false)
    setTimeout(function() {
      setCurrentIndex(function(prev) { return (prev + 1) % totalSlides })
      setIsVisible(true)
    }, 500)
  }, [totalSlides])

  useEffect(function() {
    if (totalSlides === 0) return
    var timer = setTimeout(goToNext, slideDuration * 1000)
    return function() { clearTimeout(timer) }
  }, [currentIndex, totalSlides, slideDuration, goToNext])

  if (totalSlides === 0) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: '#f8f7f4' }}>
        <p style={{ fontSize: '16px', color: '#bbb' }}>מודעות ופעילויות יופיעו כאן</p>
      </div>
    )
  }

  var isImage = currentIndex < items.length
  var currentImage = isImage ? items[currentIndex] : null
  var currentText = !isImage ? textAnnouncements[currentIndex - items.length] : null

  return (
    <div className="h-full relative overflow-hidden" style={{ background: '#f8f7f4' }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-6 pt-5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full" style={{ width: '4px', height: '20px', background: '#ffb400' }} />
          <span className="font-semibold tracking-wider" style={{ fontSize: '16px', color: '#891738' }}>
            פעילויות
          </span>
        </div>
        {totalSlides > 1 && (
          <div className="flex gap-1.5">
            {Array.from({ length: totalSlides }).map(function(_, i) {
              return (
                <div key={i} className="rounded-full" style={{
                  height: '4px',
                  transition: 'all 0.3s',
                  width: i === currentIndex ? '22px' : '8px',
                  background: i === currentIndex ? '#891738' : 'rgba(137,23,56,0.15)',
                }} />
              )
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="absolute inset-0" style={{
        paddingTop: '52px',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {isImage && currentImage ? (
          <div className="h-full p-5 pt-0">
            <img
              src={currentImage.url}
              alt={currentImage.title || ''}
              className="w-full h-full rounded-xl"
              style={{ objectFit: 'contain' }}
            />
          </div>
        ) : currentText ? (
          <div className="h-full flex items-center px-8">
            <div className="card w-full" style={{ padding: '28px', borderRight: '4px solid #891738' }}>
              <p className="font-semibold leading-relaxed" style={{ fontSize: '24px', color: '#1a1a1a' }}>
                {currentText.text}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
