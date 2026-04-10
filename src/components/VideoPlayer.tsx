'use client'

import { useState, useEffect, useRef } from 'react'
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

  // Collect all YouTube IDs
  var ytIds: string[] = []
  var titleMap: Record<number, string> = {}
  for (var v = 0; v < videos.length; v++) {
    var id = getYouTubeId(videos[v].url)
    if (id) {
      titleMap[ytIds.length] = videos[v].title || ''
      ytIds.push(id)
    }
  }

  // Timer to estimate which video is playing (for progress dots and title)
  var indexRef = useRef(0)
  var advanceAtRef = useRef(0)

  useEffect(function() {
    if (videos.length <= 1) return

    function getDuration(idx: number) {
      var video = videos[idx % videos.length]
      return (video && video.duration_seconds && video.duration_seconds > 0)
        ? (video.duration_seconds + 5) * 1000
        : 180000
    }

    advanceAtRef.current = Date.now() + getDuration(0)

    var interval = setInterval(function() {
      if (Date.now() >= advanceAtRef.current) {
        indexRef.current = (indexRef.current + 1) % videos.length
        setCurrentIndex(indexRef.current)
        advanceAtRef.current = Date.now() + getDuration(indexRef.current)
      }
    }, 1000)

    return function() { clearInterval(interval) }
  }, []) // empty deps - set once like the clock

  // Idle screen
  if (videos.length === 0 || ytIds.length === 0) {
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

  // Build a single YouTube playlist URL - YouTube handles advancement natively
  var playlistIds = ytIds.join(',')
  var embedSrc = 'https://www.youtube.com/embed/' + ytIds[0]
    + '?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0'
    + '&iv_load_policy=3&disablekb=1&fs=0&playsinline=1'
    + '&loop=1&playlist=' + playlistIds

  var safeIndex = currentIndex % videos.length
  var currentTitle = titleMap[safeIndex] || ''

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#1a1a1a',
    }}>
      {/* Blurred thumbnail background based on estimated current video */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        transform: 'scale(1.5)', filter: 'blur(40px)', opacity: 0.4,
      }}>
        <img
          src={'https://img.youtube.com/vi/' + ytIds[safeIndex % ytIds.length] + '/hqdefault.jpg'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          alt=""
        />
      </div>

      {/* Single YouTube iframe with playlist - YouTube handles advancement */}
      <iframe
        src={embedSrc}
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          border: 'none', zIndex: 1,
        }}
        allow="autoplay; encrypted-media"
        allowFullScreen
      />

      {/* Overlay to block interaction */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2 }} />

      {/* Now playing label */}
      {currentTitle && (
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
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>{currentTitle}</span>
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
                background: i === safeIndex ? '#fff' : 'rgba(255,255,255,0.3)',
              }} />
            )
          })}
        </div>
      )}
    </div>
  )
}
