'use client'

import { useState, useEffect, useRef } from 'react'
import type { MediaItem } from '@/lib/types'

export default function VideoPlayer({ videos }: { videos: MediaItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videos.length === 0) return
    const video = videoRef.current
    if (!video) return

    const handleEnded = () => {
      setCurrentIndex((prev) => (prev + 1) % videos.length)
    }
    video.addEventListener('ended', handleEnded)
    return () => video.removeEventListener('ended', handleEnded)
  }, [currentIndex, videos.length])

  // Idle screen
  if (videos.length === 0) {
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ background: '#f8f7f4' }}>
        {/* Soft background shapes */}
        <div className="absolute inset-0">
          <div className="absolute rounded-full" style={{
            width: '50vw', height: '50vw', top: '10%', right: '-10%',
            background: 'radial-gradient(circle, rgba(137,23,56,0.06) 0%, transparent 60%)',
            animation: 'breathe 8s ease-in-out infinite',
          }} />
          <div className="absolute rounded-full" style={{
            width: '35vw', height: '35vw', bottom: '10%', left: '15%',
            background: 'radial-gradient(circle, rgba(255,180,0,0.06) 0%, transparent 60%)',
            animation: 'breathe 10s ease-in-out infinite 2s',
          }} />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <img
            src="https://chabadlimassol.com/wp-content/uploads/sites/112/2022/11/Chabad-Limassol-Logo.png"
            alt="Chabad Limassol"
            className="w-32 h-32 mb-8"
            style={{ animation: 'float 6s ease-in-out infinite' }}
          />
          <div className="shimmer-text text-7xl font-bold leading-none tracking-tight">בית חב״ד</div>
          <div className="mt-3" style={{ width: '80px', height: '2px', background: 'linear-gradient(90deg, transparent, #ffb400, transparent)' }} />
          <div className="mt-3 text-2xl font-extralight tracking-[0.3em]" style={{ color: '#999' }}>
            LIMASSOL
          </div>
        </div>
      </div>
    )
  }

  const current = videos[currentIndex]

  return (
    <div className="w-full h-full relative" style={{ background: '#000' }}>
      <video
        ref={videoRef}
        key={current.id}
        src={current.url}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-contain"
      />

      {/* Now playing label */}
      {current.title && (
        <div className="absolute top-4 right-4 slide-in">
          <div className="px-4 py-2 rounded-lg flex items-center gap-2" style={{
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
            <span className="text-xs font-medium" style={{ color: '#333' }}>{current.title}</span>
          </div>
        </div>
      )}
    </div>
  )
}
