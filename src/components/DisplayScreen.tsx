'use client'

import { useState, useEffect, Component, type ReactNode } from 'react'
import { isShabbatOrYomTov, getGreeting } from '@/lib/zmanim'
import VideoPlayer from './VideoPlayer'
import AnnouncementsSlider from './AnnouncementsSlider'
import PrayerTimesPanel from './PrayerTimesPanel'
import TopBar from './TopBar'
import type { MediaItem, Announcement, PrayerTime, DisplaySettings } from '@/lib/types'

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
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#891738',
          color: '#fff', fontFamily: 'sans-serif', padding: '40px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>בית חב״ד לימסול</div>
          <div style={{ fontSize: '18px', opacity: 0.7, direction: 'ltr' }}>{this.state.error}</div>
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
  var [media, setMedia] = useState<MediaItem[]>(initialMedia)
  var [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  var [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>(initialPrayerTimes)
  var [settings] = useState<Record<string, string>>(initialSettings)
  var [holyDay, setHolyDay] = useState(false)
  var [greeting, setGreeting] = useState<string | null>(null)

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
          .catch(function() {})
      } catch (e) {}
    }
    var interval = setInterval(refresh, 30000)
    return function() { clearInterval(interval) }
  }, [])

  useEffect(function() {
    function checkHolyDay() {
      try {
        setHolyDay(isShabbatOrYomTov())
        setGreeting(getGreeting())
      } catch (e) {}
    }
    checkHolyDay()
    var interval = setInterval(checkHolyDay, 60000)
    return function() { clearInterval(interval) }
  }, [])

  useEffect(function() {
    var interval = setInterval(function() { window.location.reload() }, 600000)
    return function() { clearInterval(interval) }
  }, [])

  var slideDuration = 10
  try { slideDuration = parseInt(settings.slide_duration || '10') || 10 } catch (e) {}

  var videos = media.filter(function(m) { return m.type === 'video' })
  var images = media.filter(function(m) { return m.type === 'image' })

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', flexDirection: 'column',
      background: '#f8f7f4', overflow: 'hidden',
    }}>
      {/* Top bar */}
      <TopBar />

      {/* Main content */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        flex: 1, minHeight: 0, overflow: 'hidden',
      }}>
        {/* Upper area: video + announcements */}
        <div style={{
          display: 'flex', flexDirection: 'row',
          flex: 1, minHeight: 0, overflow: 'hidden',
        }}>
          {/* Video area - 60% */}
          <div style={{
            flex: 3, position: 'relative', minWidth: 0, overflow: 'hidden',
          }}>
            <VideoPlayer videos={holyDay ? [] : videos} />
            {/* Greeting overlay removed */}
          </div>

          {/* Sidebar - 40% announcements only */}
          <div style={{
            flex: 2, display: 'flex', flexDirection: 'column',
            borderRight: '1px solid rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            <AnnouncementsSlider items={images} announcements={announcements} slideDuration={slideDuration} />
          </div>
        </div>

        {/* Bottom row: prayer times */}
        <PrayerTimesPanel prayerTimes={prayerTimes} />
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
