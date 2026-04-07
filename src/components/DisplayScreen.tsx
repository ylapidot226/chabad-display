'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { isShabbatOrYomTov, getGreeting } from '@/lib/zmanim'
import VideoPlayer from './VideoPlayer'
import AnnouncementsSlider from './AnnouncementsSlider'
import PrayerTimesPanel from './PrayerTimesPanel'
import TopBar from './TopBar'
import type { MediaItem, Announcement, PrayerTime, DisplaySettings } from '@/lib/types'

export default function DisplayScreen() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([])
  const [settings, setSettings] = useState<DisplaySettings | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [holyDay, setHolyDay] = useState(false)
  const [greeting, setGreeting] = useState<string | null>(null)

  async function loadData() {
    const supabase = getSupabase()
    const [mediaRes, announcementsRes, prayerTimesRes, settingsRes] = await Promise.all([
      supabase.from('media').select('*').eq('active', true).order('sort_order'),
      supabase.from('announcements').select('*').eq('active', true).order('priority', { ascending: false }),
      supabase.from('prayer_times').select('*').eq('active', true).order('sort_order'),
      supabase.from('display_settings').select('*'),
    ])

    if (mediaRes.data) setMedia(mediaRes.data)
    if (announcementsRes.data) setAnnouncements(announcementsRes.data)
    if (prayerTimesRes.data) setPrayerTimes(prayerTimesRes.data)
    if (settingsRes.data) {
      const s: Record<string, string> = {}
      settingsRes.data.forEach((row: { key: string; value: string }) => { s[row.key] = row.value })
      setSettings(s as unknown as DisplaySettings)
    }
    setLoaded(true)
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [])

  // Check Shabbat/Yom Tov status every minute
  useEffect(() => {
    function checkHolyDay() {
      setHolyDay(isShabbatOrYomTov())
      setGreeting(getGreeting())
    }
    checkHolyDay()
    const interval = setInterval(checkHolyDay, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const sb = getSupabase()
    const channel = sb
      .channel('display-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prayer_times' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'display_settings' }, () => loadData())
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [])

  if (!loaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: '#f8f7f4' }}>
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: '#891738' }} />
      </div>
    )
  }

  const slideDuration = parseInt(settings?.slide_duration || '10')

  // Split media: videos go to VideoPlayer, images go to AnnouncementsSlider
  const videos = media.filter((m) => m.type === 'video')
  const images = media.filter((m) => m.type === 'image')

  // On Shabbat/Yom Tov: no videos, only images/announcements
  if (holyDay) {
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col no-scrollbar" style={{ background: '#f8f7f4' }}>
        <TopBar />

        <div className="flex-1 flex min-h-0">
          {/* Left: Greeting + Announcements slider (larger area) */}
          <div className="flex-1 relative min-w-0 flex flex-col">
            {/* Greeting banner */}
            {greeting && (
              <div className="flex-shrink-0 flex items-center justify-center py-12" style={{
                background: 'linear-gradient(135deg, #891738 0%, #a01d45 100%)',
              }}>
                <span className="text-6xl font-bold text-white">{greeting}</span>
              </div>
            )}
            {/* Announcements/images fill the rest */}
            <div className="flex-1 min-h-0">
              <AnnouncementsSlider items={images} announcements={announcements} slideDuration={slideDuration} />
            </div>
          </div>

          {/* Right sidebar: prayer times */}
          <div className="w-[480px] flex-shrink-0 flex flex-col" style={{
            borderRight: '1px solid rgba(0,0,0,0.06)',
          }}>
            <div className="flex-1">
              <PrayerTimesPanel prayerTimes={prayerTimes} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col no-scrollbar" style={{ background: '#f8f7f4' }}>
      {/* Top bar */}
      <TopBar />

      {/* Main layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Video - always playing */}
        <div className="flex-[3] relative min-w-0">
          <VideoPlayer videos={videos} />
        </div>

        {/* Right sidebar: announcements and prayer times */}
        <div className="flex-[2] flex-shrink-0 flex flex-col" style={{
          borderRight: '1px solid rgba(0,0,0,0.06)',
        }}>
          {/* Announcements - top part of sidebar */}
          <div className="flex-1 min-h-0">
            <AnnouncementsSlider items={images} announcements={announcements} slideDuration={slideDuration} />
          </div>

          {/* Prayer times - bottom part of sidebar */}
          <div className="flex-shrink-0">
            <PrayerTimesPanel prayerTimes={prayerTimes} />
          </div>
        </div>
      </div>
    </div>
  )
}
