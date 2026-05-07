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

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
}

interface SlideItem {
  type: 'youtube' | 'video' | 'image'
  url: string
  ytId?: string
  title: string
  duration: number // seconds
}

function buildSlides(videos: MediaItem[]): SlideItem[] {
  var result: SlideItem[] = []
  for (var i = 0; i < videos.length; i++) {
    var v = videos[i]
    var ytId = getYouTubeId(v.url)
    if (ytId) {
      result.push({
        type: 'youtube',
        url: v.url,
        ytId,
        title: v.title || '',
        duration: v.duration_seconds && v.duration_seconds > 0 ? v.duration_seconds : 30,
      })
    } else if (isDirectVideo(v.url)) {
      result.push({
        type: 'video',
        url: v.url,
        title: v.title || '',
        duration: v.duration_seconds && v.duration_seconds > 0 ? v.duration_seconds : 120,
      })
    }
  }
  return result
}

export default function VideoPlayer({ videos }: { videos: MediaItem[] }) {
  var slides = buildSlides(videos)
  var [currentIndex, setCurrentIndex] = useState(0)
  var [visible, setVisible] = useState(true)
  var slidesRef = useRef(slides)
  slidesRef.current = slides
  var indexRef = useRef(0)

  var goNext = useCallback(function() {
    if (slidesRef.current.length <= 1) return
    setVisible(false)
    setTimeout(function() {
      indexRef.current = (indexRef.current + 1) % slidesRef.current.length
      setCurrentIndex(indexRef.current)
      setVisible(true)
    }, 700)
  }, [])

  useEffect(function() {
    if (slides.length === 0) return
    var slide = slidesRef.current[currentIndex]
    if (slide.type === 'video') return // video element handles its own advancement via onEnded

    var timer = setTimeout(goNext, slide.duration * 1000)
    return function() { clearTimeout(timer) }
  }, [currentIndex, goNext, slides.length])

  // Idle screen
  if (slides.length === 0) {
    return (
      <div style={{
        width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
        background: '#f8f7f4',
      }}>
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

  var safeIndex = currentIndex % slides.length
  var current = slides[safeIndex]

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#1a1a1a',
    }}>
      {/* Slide content */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(1.03)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}>
        {current.type === 'youtube' && (
          <>
            {/* Blurred background */}
            <img
              src={'https://img.youtube.com/vi/' + current.ytId + '/hqdefault.jpg'}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                objectFit: 'cover', transform: 'scale(1.5)', filter: 'blur(40px)', opacity: 0.4,
              }}
              alt=""
            />
            {/* Main thumbnail */}
            <img
              src={'https://img.youtube.com/vi/' + current.ytId + '/maxresdefault.jpg'}
              onError={function(e) {
                (e.target as HTMLImageElement).src = 'https://img.youtube.com/vi/' + current.ytId + '/hqdefault.jpg'
              }}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                objectFit: 'contain',
              }}
              alt={current.title}
            />
            {/* Play icon overlay */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{
                width: 0, height: 0,
                borderTop: '20px solid transparent',
                borderBottom: '20px solid transparent',
                borderLeft: '34px solid rgba(255,255,255,0.9)',
                marginLeft: '6px',
              }} />
            </div>
          </>
        )}

        {current.type === 'video' && (
          <video
            key={current.url}
            src={current.url}
            autoPlay
            muted={false}
            playsInline
            onEnded={goNext}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              objectFit: 'contain',
            }}
          />
        )}
      </div>

      {/* Interaction blocker */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2 }} />

      {/* Title pill */}
      {current.title && (
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
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
      {slides.length > 1 && (
        <div style={{
          position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '6px', zIndex: 10,
        }}>
          {slides.map(function(_, i) {
            return (
              <div key={i} style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: i === safeIndex ? '#fff' : 'rgba(255,255,255,0.3)',
              }} />
            )
          })}
        </div>
      )}
    </div>
  )
}
