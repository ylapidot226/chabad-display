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

function DisplayScreenInner() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([])
  const [settings, setSettings] = useState<DisplaySettings | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [holyDay, setHolyDay] = useState(false)
  const [greeting, setGreeting] = useState<string | null>(null)

  // Load all data from a single server API (no Supabase client on TV browser)
  function loadData() {
    fetch('/api/display')
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status)
        return res.json()
      })
      .then(function(data) {
        if (data.media) setMedia(data.media)
        if (data.announcements) setAnnouncements(data.announcements)
        if (data.prayer_times) setPrayerTimes(data.prayer_times)
        if (data.settings) setSettings(data.settings as unknown as DisplaySettings)
        setLoadError(null)
        setLoaded(true)
      })
      .catch(function(err) {
        var msg = err && err.message ? err.message : String(err)
        console.error('Failed to load data:', msg)
        setLoadError(msg)
        setLoaded(true)
      })
  }

  useEffect(function() {
    loadData()
    var interval = setInterval(loadData, 30000)
    return function() { clearInterval(interval) }
  }, [])

  // Check Shabbat/Yom Tov status every minute
  useEffect(function() {
    function checkHolyDay() {
      try {
        setHolyDay(isShabbatOrYomTov())
        setGreeting(getGreeting())
      } catch (e) {
        console.error('Holy day check failed:', e)
      }
    }
    checkHolyDay()
    var interval = setInterval(checkHolyDay, 60000)
    return function() { clearInterval(interval) }
  }, [])

  if (!loaded) {
    return (
      <div style={{
        height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: '#f8f7f4',
      }}>
        <img
          src="https://chabadlimassol.com/wp-content/uploads/sites/112/2022/11/Chabad-Limassol-Logo.png"
          alt="Chabad Limassol"
          style={{ width: '120px', height: '120px', marginBottom: '30px' }}
        />
        <div style={{ fontSize: '36px', color: '#891738', fontWeight: 'bold', marginBottom: '15px' }}>
          בית חב״ד לימסול
        </div>
        <div style={{
          width: '50px', height: '50px', borderRadius: '50%',
          border: '3px solid #eee', borderTopColor: '#891738',
          animation: 'spin 1s linear infinite',
        }} />
        <div style={{ fontSize: '16px', color: '#999', marginTop: '15px' }}>טוען...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // Show error state if data failed to load
  if (loadError && media.length === 0 && prayerTimes.length === 0) {
    return (
      <div style={{
        height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: '#891738',
        color: '#fff', fontFamily: 'sans-serif', padding: '40px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>בית חב״ד לימסול</div>
        <div style={{ fontSize: '16px', opacity: 0.7, maxWidth: '600px', direction: 'ltr' }}>
          Connection error: {loadError}
        </div>
        <div style={{ marginTop: '20px', fontSize: '14px', opacity: 0.5 }}>
          Retrying every 30 seconds...
        </div>
      </div>
    )
  }

  var slideDuration = 10
  try { slideDuration = parseInt(settings?.slide_duration || '10') || 10 } catch (e) { /* default */ }

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
        }}>
          <div className="flex-1 min-h-0">
            <AnnouncementsSlider items={images} announcements={announcements} slideDuration={slideDuration} />
          </div>
          <div className="flex-shrink-0">
            <PrayerTimesPanel prayerTimes={prayerTimes} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DisplayScreen() {
  return (
    <ErrorBoundary>
      <DisplayScreenInner />
    </ErrorBoundary>
  )
}
