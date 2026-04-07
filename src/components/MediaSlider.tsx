'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { MediaItem } from '@/lib/types'

interface Props {
  items: MediaItem[]
  slideDuration: number
}

export default function MediaSlider({ items, slideDuration }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const goToNext = useCallback(() => {
    if (items.length <= 1) return
    setIsVisible(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
      setIsVisible(true)
    }, 900)
  }, [items.length])

  useEffect(() => {
    if (items.length === 0) return
    const current = items[currentIndex]
    if (current?.type === 'video') {
      const video = videoRef.current
      if (video) {
        const handleEnded = () => goToNext()
        video.addEventListener('ended', handleEnded)
        return () => video.removeEventListener('ended', handleEnded)
      }
    } else {
      const duration = (current?.duration_seconds || slideDuration) * 1000
      const timer = setTimeout(goToNext, duration)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, items, slideDuration, goToNext])

  // ── Empty state: premium idle screen ──
  if (items.length === 0) {
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ background: '#050505' }}>
        {/* Ambient background orbs */}
        <div className="absolute inset-0">
          <div className="absolute rounded-full" style={{
            width: '60vw', height: '60vw', top: '10%', right: '-15%',
            background: 'radial-gradient(circle, rgba(137,23,56,0.08) 0%, transparent 70%)',
            animation: 'breathe 8s ease-in-out infinite',
          }} />
          <div className="absolute rounded-full" style={{
            width: '40vw', height: '40vw', bottom: '5%', left: '10%',
            background: 'radial-gradient(circle, rgba(255,180,0,0.04) 0%, transparent 70%)',
            animation: 'breathe 10s ease-in-out infinite 2s',
          }} />
        </div>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Main title */}
          <div className="shimmer-text text-[7rem] font-bold leading-none tracking-tight" style={{
            animation: 'float 6s ease-in-out infinite, shimmer 4s linear infinite',
          }}>
            בית חב״ד
          </div>

          {/* Thin separator */}
          <div className="mt-5 mb-5" style={{
            width: '120px', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,180,0,0.3), transparent)',
          }} />

          {/* Subtitle */}
          <div className="text-3xl font-extralight tracking-[0.4em]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            LIMASSOL • CYPRUS
          </div>
        </div>

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>
    )
  }

  const current = items[currentIndex]

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#050505' }}>
      {/* Media */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(1.02)',
          transition: 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {current.type === 'video' ? (
          <video
            ref={videoRef}
            key={current.id}
            src={current.url}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            key={current.id}
            src={current.url}
            alt={current.title || ''}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Vignette overlay for depth */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(5,5,5,0.3) 100%)',
      }} />

      {/* Title pill - bottom right */}
      {current.title && (
        <div className="absolute bottom-5 right-5 slide-in">
          <div className="glass px-5 py-2.5 rounded-lg">
            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {current.title}
            </span>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {items.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0">
          {/* Track */}
          <div className="h-[2px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="h-full rounded-full" style={{
              width: `${((currentIndex + 1) / items.length) * 100}%`,
              background: 'linear-gradient(90deg, #891738, #ffb400)',
              transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 0 12px rgba(255,180,0,0.3)',
            }} />
          </div>
        </div>
      )}
    </div>
  )
}
