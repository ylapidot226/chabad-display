'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { MediaItem } from '@/lib/types'

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

function isYouTubeUrl(url: string): boolean {
  return getYouTubeId(url) !== null
}

export default function VideoPlayer({ videos }: { videos: MediaItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const goToNext = useCallback(() => {
    if (videos.length <= 1) return
    setCurrentIndex((prev) => (prev + 1) % videos.length)
  }, [videos.length])

  // Handle regular video ended
  useEffect(() => {
    if (videos.length === 0) return
    const current = videos[currentIndex]
    if (!current || isYouTubeUrl(current.url)) return

    const video = videoRef.current
    if (!video) return

    const handleEnded = () => goToNext()
    video.addEventListener('ended', handleEnded)
    return () => video.removeEventListener('ended', handleEnded)
  }, [currentIndex, videos, goToNext])

  // Handle YouTube video duration (auto-advance after duration_seconds or 60s default)
  useEffect(() => {
    if (videos.length === 0) return
    const current = videos[currentIndex]
    if (!current || !isYouTubeUrl(current.url)) return

    const duration = (current.duration_seconds || 60) * 1000
    const timer = setTimeout(goToNext, duration)
    return () => clearTimeout(timer)
  }, [currentIndex, videos, goToNext])

  // Idle screen
  if (videos.length === 0) {
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ background: '#f8f7f4' }}>
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
  const youtubeId = getYouTubeId(current.url)

  return (
    <div className="w-full h-full relative" style={{ background: '#000' }}>
      {youtubeId ? (
        <iframe
          key={current.id}
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=0&modestbranding=1&rel=0&showinfo=0`}
          className="w-full h-full"
          style={{ border: 'none' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          key={current.id}
          src={current.url}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain"
        />
      )}

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

      {/* Progress dots */}
      {videos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {videos.map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full transition-all" style={{
              background: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.3)',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}
