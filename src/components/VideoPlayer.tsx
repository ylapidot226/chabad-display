'use client'

import { useEffect, useRef, useState } from 'react'
import type { MediaItem } from '@/lib/types'

// ── YouTube IFrame API singleton loader ───────────────────────────────────────

let ytState: 'idle' | 'loading' | 'ready' = 'idle'
const ytQueue: Array<() => void> = []

function ensureYtApi(cb: () => void) {
  if (ytState === 'ready') { cb(); return }
  ytQueue.push(cb)
  if (ytState === 'loading') return
  ytState = 'loading'
  ;(window as typeof window & { onYouTubeIframeAPIReady: () => void }).onYouTubeIframeAPIReady = function () {
    ytState = 'ready'
    ytQueue.splice(0).forEach(function (fn) { fn() })
  }
  var s = document.createElement('script')
  s.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(s)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getYtId(url: string): string | null {
  var patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (var i = 0; i < patterns.length; i++) {
    var m = url.match(patterns[i])
    if (m) return m[1]
  }
  return null
}

function isVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
}

interface Slide {
  type: 'youtube' | 'video'
  ytId: string | null
  url: string
  title: string
}

function buildSlides(videos: MediaItem[]): Slide[] {
  var result: Slide[] = []
  for (var i = 0; i < videos.length; i++) {
    var v = videos[i]
    var ytId = getYtId(v.url)
    if (ytId) {
      result.push({ type: 'youtube', ytId, url: v.url, title: v.title || '' })
    } else if (isVideoFile(v.url)) {
      result.push({ type: 'video', ytId: null, url: v.url, title: v.title || '' })
    }
  }
  return result
}

// ── Idle screen ───────────────────────────────────────────────────────────────

function IdleScreen() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#f8f7f4' }}>
      <div style={{
        position: 'absolute', width: '50vw', height: '50vw', top: '10%', right: '-10%', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(137,23,56,0.06) 0%, transparent 60%)',
        animation: 'breathe 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: '35vw', height: '35vw', bottom: '10%', left: '15%', borderRadius: '50%',
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
        <div style={{ marginTop: '12px', fontSize: '24px', fontWeight: 200, letterSpacing: '0.3em', color: '#999' }}>LIMASSOL</div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VideoPlayer({ videos }: { videos: MediaItem[] }) {
  var slides = buildSlides(videos)
  var [idx, setIdx] = useState(0)

  // Refs so closures always see current values
  var idxRef = useRef(0)
  var slidesRef = useRef(slides)
  slidesRef.current = slides

  // YouTube player instance (typed as any — YT global loaded at runtime)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var playerRef = useRef<any>(null)
  // The div that YouTube replaces with an iframe
  var ytContainerRef = useRef<HTMLDivElement>(null)
  // Whether the YT player has been initialized
  var ytReadyRef = useRef(false)

  // ── Advance to next slide ──────────────────────────────────────────────────
  function advance() {
    var all = slidesRef.current
    if (all.length === 0) return
    var next = (idxRef.current + 1) % all.length
    idxRef.current = next
    setIdx(next)

    // If next slide is YouTube and player is alive → just load new video ID
    // (avoids destroying and recreating the player, which causes a flash)
    if (all[next].type === 'youtube' && playerRef.current && ytReadyRef.current) {
      try {
        playerRef.current.loadVideoById({ videoId: all[next].ytId! })
      } catch (_) {
        // player might be in a bad state; it will reinitialize via the effect below
      }
    }
  }

  // ── YouTube player lifecycle ───────────────────────────────────────────────
  // Runs whenever the current slide changes to a YouTube slide
  useEffect(function () {
    var current = slidesRef.current[idxRef.current]
    if (!current || current.type !== 'youtube') return
    if (!ytContainerRef.current) return

    // If already initialized, loadVideoById was already called in advance()
    if (ytReadyRef.current && playerRef.current) return

    // Create a fresh player
    ensureYtApi(function () {
      if (!ytContainerRef.current) return

      // If somehow a player already exists, destroy it first
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch (_) {}
        playerRef.current = null
        ytReadyRef.current = false
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      var YTPlayer = (window as any).YT.Player
      playerRef.current = new YTPlayer(ytContainerRef.current!, {
        videoId: slidesRef.current[idxRef.current]?.ytId || '',
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onReady: function (e: any) {
            ytReadyRef.current = true
            e.target.playVideo()
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: function (e: any) {
            if (e.data === 0) advance() // 0 = YT.PlayerState.ENDED
          },
          onError: function () {
            advance() // skip blocked / unavailable videos
          },
        },
      })
    })

    return function () {
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch (_) {}
        playerRef.current = null
        ytReadyRef.current = false
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — player lifecycle managed via refs

  if (slides.length === 0) return <IdleScreen />

  var safeIdx = idx % slides.length
  var current = slides[safeIdx]

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#000' }}>

      {/* YouTube player container — always mounted, hidden when not in use */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: current.type === 'youtube' ? 'block' : 'none',
        }}
      >
        <div
          ref={ytContainerRef}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* HTML5 video — key forces fresh element on each new URL */}
      {current.type === 'video' && (
        <video
          key={current.url}
          src={current.url}
          autoPlay
          playsInline
          onEnded={advance}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
        />
      )}

      {/* Interaction blocker */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }} />

      {/* Title pill */}
      {current.title && (
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
          <div style={{
            padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'breathe 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>{current.title}</span>
          </div>
        </div>
      )}

      {/* Progress dots */}
      {slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 10 }}>
          {slides.map(function (_, i) {
            return (
              <div key={i} style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: i === safeIdx ? '#fff' : 'rgba(255,255,255,0.3)',
              }} />
            )
          })}
        </div>
      )}
    </div>
  )
}
