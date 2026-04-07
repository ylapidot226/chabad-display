'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { MediaItem } from '@/lib/types'

function getYouTubeId(url: string): string | null {
  var patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (var p = 0; p < patterns.length; p++) {
    var match = url.match(patterns[p])
    if (match) return match[1]
  }
  return null
}

export default function VideoPlayer({ videos }: { videos: MediaItem[] }) {
  var [currentIndex, setCurrentIndex] = useState(0)
  var videoRef = useRef<HTMLVideoElement>(null)
  var timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  var goToNext = useCallback(function() {
    setCurrentIndex(function(prev) { return (prev + 1) % (videos.length || 1) })
  }, [videos.length])

  // Regular video: ended event
  useEffect(function() {
    if (videos.length === 0) return
    var current = videos[currentIndex]
    if (!current || getYouTubeId(current.url)) return

    var video = videoRef.current
    if (!video) return

    var handleEnded = function() {
      if (videos.length > 1) goToNext()
    }
    video.addEventListener('ended', handleEnded)
    var v = video
    return function() { v.removeEventListener('ended', handleEnded) }
  }, [currentIndex, videos, goToNext])

  // YouTube: use timer to advance (since YT API doesn't work on LG TV)
  // Each video plays for its duration or 3 minutes default, then advances
  useEffect(function() {
    if (videos.length <= 1) return
    var current = videos[currentIndex]
    if (!current || !getYouTubeId(current.url)) return

    // Default 3 minutes per YouTube video, then advance
    var duration = (current.duration_seconds && current.duration_seconds > 0) ? current.duration_seconds * 1000 : 180000
    timerRef.current = setTimeout(goToNext, duration)
    return function() {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentIndex, videos, goToNext])

  // Idle screen (Shabbat/Yom Tov or no videos)
  if (videos.length === 0) {
    return (
      <div style={{
        width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
        background: '#f8f7f4',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', width: '50vw', height: '50vw', top: '10%', right: '-10%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(137,23,56,0.06) 0%, transparent 60%)',
          animation: 'breathe 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: '35vw', height: '35vw', bottom: '10%', left: '15%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,180,0,0.06) 0%, transparent 60%)',
          animation: 'breathe 10s ease-in-out infinite 2s',
        }} />

        {/* Logo + text */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <img
            src="https://chabadlimassol.com/wp-content/uploads/sites/112/2022/11/Chabad-Limassol-Logo.png"
            alt="Chabad Limassol"
            style={{ width: '128px', height: '128px', marginBottom: '32px', animation: 'float 6s ease-in-out infinite' }}
          />
          <div className="shimmer-text" style={{ fontSize: '72px', fontWeight: 'bold', lineHeight: 1 }}>בית חב״ד</div>
          <div style={{ width: '80px', height: '2px', marginTop: '12px', background: 'linear-gradient(90deg, transparent, #ffb400, transparent)' }} />
          <div style={{ marginTop: '12px', fontSize: '24px', fontWeight: 200, letterSpacing: '0.3em', color: '#999' }}>
            LIMASSOL
          </div>
        </div>
      </div>
    )
  }

  var current = videos[currentIndex]
  var youtubeId = getYouTubeId(current.url)

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#1a1a1a',
    }}>
      {youtubeId ? (
        <>
          {/* Blurred thumbnail background */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            transform: 'scale(1.5)', filter: 'blur(40px)', opacity: 0.4,
          }}>
            <img
              src={'https://img.youtube.com/vi/' + youtubeId + '/hqdefault.jpg'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              alt=""
            />
          </div>
          {/* YouTube iframe - simple embed that works on all browsers */}
          <iframe
            key={current.id + '-' + currentIndex}
            src={'https://www.youtube.com/embed/' + youtubeId + '?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1' + (videos.length === 1 ? '&loop=1&playlist=' + youtubeId : '')}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 1,
            }}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
          {/* Overlay to block interaction */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2 }} />
        </>
      ) : (
        <video
          ref={videoRef}
          key={current.id}
          src={current.url}
          autoPlay
          playsInline
          loop={videos.length === 1}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      {/* Now playing label */}
      {current.title && (
        <div style={{
          position: 'absolute', top: '16px', right: '16px', zIndex: 10,
        }}>
          <div style={{
            padding: '8px 16px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444',
              animation: 'breathe 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>{current.title}</span>
          </div>
        </div>
      )}

      {/* Progress dots */}
      {videos.length > 1 && (
        <div style={{
          position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '6px', zIndex: 10,
        }}>
          {videos.map(function(_, i) {
            return (
              <div key={i} style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s',
              }} />
            )
          })}
        </div>
      )}
    </div>
  )
}
