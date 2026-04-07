'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MediaItem, Announcement } from '@/lib/types'

interface Props {
  items: MediaItem[]
  announcements: Announcement[]
  slideDuration: number
}

export default function AnnouncementsSlider({ items, announcements, slideDuration }: Props) {
  var [currentIndex, setCurrentIndex] = useState(0)
  var [isVisible, setIsVisible] = useState(true)

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
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f4' }}>
        <p style={{ fontSize: '16px', color: '#bbb' }}>מודעות ופעילויות יופיעו כאן</p>
      </div>
    )
  }

  var isImage = currentIndex < items.length
  var currentImage = isImage ? items[currentIndex] : null
  var currentText = !isImage ? textAnnouncements[currentIndex - items.length] : null

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#f8f7f4' }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '16px 20px 8px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '4px', height: '20px', borderRadius: '4px', background: '#ffb400' }} />
          <span style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '1px', color: '#891738' }}>פעילויות</span>
        </div>
        {totalSlides > 1 && (
          <div style={{ display: 'flex', gap: '6px' }}>
            {Array.from({ length: totalSlides }).map(function(_, i) {
              return (
                <div key={i} style={{
                  height: '4px', borderRadius: '4px',
                  width: i === currentIndex ? '22px' : '8px',
                  background: i === currentIndex ? '#891738' : 'rgba(137,23,56,0.15)',
                  transition: 'all 0.3s',
                }} />
              )
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{
        position: 'absolute', top: '52px', left: 0, right: 0, bottom: 0,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}>
        {isImage && currentImage ? (
          <div style={{ height: '100%', padding: '0 16px 16px 16px' }}>
            <img
              src={currentImage.url}
              alt={currentImage.title || ''}
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }}
            />
          </div>
        ) : currentText ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
            <div style={{
              width: '100%', padding: '24px', background: '#fff',
              borderRadius: '14px', borderRight: '4px solid #891738',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <p style={{ fontSize: '22px', fontWeight: 600, lineHeight: 1.6, color: '#1a1a1a' }}>
                {currentText.text}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
