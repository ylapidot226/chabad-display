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

// Extend window for YouTube IFrame API
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
}

export default function VideoPlayer({ videos }: { videos: MediaItem[] }) {
  var [currentIndex, setCurrentIndex] = useState(0)
  var playerRef = useRef<any>(null)
  var indexRef = useRef(0)
  var ytIdsRef = useRef<string[]>([])
  var containerRef = useRef<HTMLDivElement>(null)

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
  ytIdsRef.current = ytIds

  var playNext = useCallback(function() {
    if (ytIdsRef.current.length <= 1) return
    indexRef.current = (indexRef.current + 1) % ytIdsRef.current.length
    setCurrentIndex(indexRef.current)
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(ytIdsRef.current[indexRef.current])
    }
  }, [])

  useEffect(function() {
    if (ytIds.length === 0) return

    function initPlayer() {
      if (!containerRef.current) return
      // Create a div for the player inside the container
      var playerDiv = document.createElement('div')
      playerDiv.id = 'yt-player'
      containerRef.current.appendChild(playerDiv)

      playerRef.current = new window.YT.Player('yt-player', {
        width: '100%',
        height: '100%',
        videoId: ytIdsRef.current[0],
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
        },
        events: {
          onStateChange: function(event: any) {
            // 0 = ENDED
            if (event.data === 0) {
              playNext()
            }
          },
          onError: function() {
            // On error, skip to next video
            playNext()
          },
        },
      })
    }

    // Load YouTube IFrame API if not already loaded
    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
      if (!document.getElementById('yt-api-script')) {
        var script = document.createElement('script')
        script.id = 'yt-api-script'
        script.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(script)
      }
    }

    // Fallback timer in case onStateChange doesn't fire (e.g., ad blockers)
    var fallbackInterval: ReturnType<typeof setInterval> | null = null
    if (ytIdsRef.current.length > 1) {
      var advanceAt = Date.now() + 300000 // 5 min fallback

      fallbackInterval = setInterval(function() {
        // Check if player reports ended state, or if enough time passed
        try {
          var state = playerRef.current && playerRef.current.getPlayerState
            ? playerRef.current.getPlayerState()
            : -1
          // 0 = ended, -1 = unstarted
          if (state === 0) {
            playNext()
            advanceAt = Date.now() + 300000
          }
        } catch (e) {}
        // Hard fallback - if 5 min passed, force advance
        if (Date.now() >= advanceAt) {
          playNext()
          advanceAt = Date.now() + 300000
        }
      }, 2000)
    }

    return function() {
      if (fallbackInterval) clearInterval(fallbackInterval)
      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy() } catch (e) {}
      }
    }
  }, []) // empty deps

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

  var safeIndex = currentIndex % ytIds.length
  var currentTitle = titleMap[safeIndex] || ''

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#1a1a1a',
    }}>
      {/* Blurred thumbnail background */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        transform: 'scale(1.5)', filter: 'blur(40px)', opacity: 0.4,
      }}>
        <img
          src={'https://img.youtube.com/vi/' + ytIds[safeIndex] + '/hqdefault.jpg'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          alt=""
        />
      </div>

      {/* YouTube Player API container */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          zIndex: 1,
        }}
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
      {ytIds.length > 1 && (
        <div style={{
          position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '6px', zIndex: 10,
        }}>
          {ytIds.map(function(_, i) {
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
