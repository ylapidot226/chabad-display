'use client'

import { useState, useRef } from 'react'
import type { MediaItem } from '@/lib/types'

// Only accept direct video file URLs — no YouTube
function isPlayableVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
}

function IdleScreen() {
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

export default function VideoPlayer({ videos }: { videos: MediaItem[] }) {
  // Filter to only playable local video files — YouTube URLs are ignored
  var items = videos.filter(function(v) { return isPlayableVideo(v.url) })

  var [currentIndex, setCurrentIndex] = useState(0)
  // indexRef keeps index in sync for the onEnded closure without stale state
  var indexRef = useRef(0)
  var itemsRef = useRef(items)
  itemsRef.current = items

  function advance() {
    var next = (indexRef.current + 1) % itemsRef.current.length
    indexRef.current = next
    setCurrentIndex(next)
  }

  if (items.length === 0) {
    return <IdleScreen />
  }

  var idx = currentIndex % items.length
  var current = items[idx]

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#000',
    }}>
      {/*
        key=url ensures a brand-new <video> element when advancing.
        A new element triggers autoPlay reliably on any browser.
      */}
      <video
        key={current.url}
        src={current.url}
        autoPlay
        playsInline
        onEnded={advance}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          objectFit: 'contain',
        }}
      />

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
      {items.length > 1 && (
        <div style={{
          position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '6px', zIndex: 10,
        }}>
          {items.map(function(_, i) {
            return (
              <div key={i} style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: i === idx ? '#fff' : 'rgba(255,255,255,0.3)',
              }} />
            )
          })}
        </div>
      )}
    </div>
  )
}
