'use client'

import { useState, useEffect, Component, type ReactNode } from 'react'
import { isShabbatOrYomTov, getGreeting } from '@/lib/zmanim'
import VideoPlayer from './VideoPlayer'
import AnnouncementsSlider from './AnnouncementsSlider'
import PrayerTimesPanel from './PrayerTimesPanel'
import TopBar from './TopBar'
import type { MediaItem, Announcement, PrayerTime, DisplaySettings } from '@/lib/types'

// Error boundary to catch and display errors on TV screens
class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message || String(error) }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#891738',
          color: '#fff', fontFamily: 'sans-serif', padding: '40px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>בית חב״ד לימסול</div>
          <div style={{ fontSize: '18px', opacity: 0.7, maxWidth: '600px', direction: 'ltr' }}>
            Error: {this.state.error}
          </div>
          <div style={{ marginTop: '30px', fontSize: '14px', opacity: 0.5 }}>
            Reloading in 30 seconds...
          </div>
        </div>
      )
    }
    return this.props.children
  }
  componentDidCatch() {
    setTimeout(function() { window.location.reload() }, 30000)
  }
}

interface Props {
  initialMedia: MediaItem[]
  initialAnnouncements: Announcement[]
  initialPrayerTimes: PrayerTime[]
  initialSettings: Record<string, string>
}

function DisplayScreenInner({ initialMedia, initialAnnouncements, initialPrayerTimes, initialSettings }: Props) {
  // Start with server-provided data - no loading needed!
  const [media, setMedia] = useState<MediaItem[]>(initialMedia)
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>(initialPrayerTimes)
  const [settings] = useState<Record<string, string>>(initialSettings)
  const [holyDay, setHolyDay] = useState(false)
  const [greeting, setGreeting] = useState<string | null>(null)

  // Background refresh every 30 seconds (if fetch works on this browser)
  useEffect(function() {
    function refresh() {
      try {
        fetch('/api/display')
          .then(function(res) { return res.json() })
          .then(function(data) {
            if (data.media) setMedia(data.media)
            if (data.announcements) setAnnouncements(data.announcements)
            if (data.prayer_times) setPrayerTimes(data.prayer_times)
          })
          .catch(function() { /* silent - we already have data from SSR */ })
      } catch (e) {
        /* fetch not supported on this browser - that's ok, we have SSR data */
      }
    }
    var interval = setInterval(refresh, 30000)
    return function() { clearInterval(interval) }
  }, [])

  // Check Shabbat/Yom Tov status every minute
  useEffect(function() {
    function checkHolyDay() {
      try {
        setHolyDay(isShabbatOrYomTov())
        setGreeting(getGreeting())
      } catch (e) {
        /* silent */
      }
    }
    checkHolyDay()
    var interval = setInterval(checkHolyDay, 60000)
    return function() { clearInterval(interval) }
  }, [])

  // Auto-reload every 10 minutes to get fresh SSR data even if fetch doesn't work
  useEffect(function() {
    var interval = setInterval(function() {
      window.location.reload()
    }, 600000)
    return function() { clearInterval(interval) }
  }, [])

  var slideDuration = 10
  try { slideDuration = parseInt(settings.slide_duration || '10') || 10 } catch (e) { /* default */ }

  var videos = media.filter(function(m) { return m.type === 'video' })
  var images = media.filter(function(m) { return m.type === 'image' })

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col no-scrollbar" style={{ background: '#f8f7f4' }}>
      <TopBar />

      <div className="flex-1 flex min-h-0">
        {/* Video area (idle screen during Shabbat/Yom Tov) */}
        <div className="flex-[3] relative min-w-0">
          <VideoPlayer videos={holyDay ? [] : videos} />
          {holyDay && greeting && (
            <div className="absolute bottom-10 left-0 right-0 flex justify-center z-10">
              <div className="px-10 py-5 rounded-2xl" style={{
                background: 'rgba(137,23,56,0.9)',
                boxShadow: '0 4px 20px rgba(137,23,56,0.3)',
              }}>
                <span className="text-5xl font-bold text-white">{greeting}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="flex-[2] flex-shrink-0 flex flex-col" style={{
          borderRight: '1px solid rgba(0,0,0,0.06)',
          maxWidth: '480px',
        }}>
          {/* Announcements - top half */}
          <div className="flex-1" style={{ minHeight: 0 }}>
            <AnnouncementsSlider items={images} announcements={announcements} slideDuration={slideDuration} />
          </div>
          {/* Prayer times - bottom half */}
          <div className="flex-1" style={{ minHeight: 0 }}>
            <PrayerTimesPanel prayerTimes={prayerTimes} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DisplayScreen(props: Props) {
  return (
    <ErrorBoundary>
      <DisplayScreenInner {...props} />
    </ErrorBoundary>
  )
}
