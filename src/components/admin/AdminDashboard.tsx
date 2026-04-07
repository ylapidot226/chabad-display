'use client'

import { useState } from 'react'
import MediaManager from './MediaManager'
import AnnouncementsManager from './AnnouncementsManager'
import PrayerTimesManager from './PrayerTimesManager'
import SettingsManager from './SettingsManager'

const tabs = [
  { id: 'media', label: 'מדיה' },
  { id: 'announcements', label: 'מודעות' },
  { id: 'prayer', label: 'זמני תפילות' },
  { id: 'settings', label: 'הגדרות' },
] as const

type TabId = (typeof tabs)[number]['id']

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('media')

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: '#0f0f0f' }}>
      {/* Header */}
      <header className="px-8 py-5" style={{
        background: 'linear-gradient(135deg, #891738 0%, #6b1230 100%)',
      }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-wide gold-gradient">מרכז שליטה — בית חב״ד לימסול</h1>
          <a
            href="/"
            target="_blank"
            className="text-sm opacity-60 hover:opacity-100 transition-opacity"
          >
            צפייה במסך &larr;
          </a>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-5 py-3.5 text-sm font-medium transition-all relative"
              style={{
                color: activeTab === tab.id ? '#ffb400' : 'rgba(255,255,255,0.4)',
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#ffb400' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-8">
        {activeTab === 'media' && <MediaManager />}
        {activeTab === 'announcements' && <AnnouncementsManager />}
        {activeTab === 'prayer' && <PrayerTimesManager />}
        {activeTab === 'settings' && <SettingsManager />}
      </main>
    </div>
  )
}
