'use client'

import { useState, useEffect } from 'react'
import type { DisplaySettings } from '@/lib/types'

export default function SettingsManager() {
  const [settings, setSettings] = useState<DisplaySettings>({
    ticker_speed: '30', slide_duration: '10', theme: 'dark',
    shul_name: 'בית חב"ד לימסול', show_weather: 'true',
    weather_city: 'Limassol', show_date: 'true', show_zmanim: 'true',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function loadSettings() {
    const res = await fetch('/api/settings')
    if (res.ok) {
      const data = await res.json()
      setSettings((s) => ({ ...s, ...data }))
    }
  }

  useEffect(() => { loadSettings() }, [])

  async function handleSave() {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputStyle = {
    background: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '10px',
    color: '#333',
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">הגדרות תצוגה</h2>

      <div className="glass-card p-8 space-y-6">
        <div>
          <label className="block text-sm text-gray-500 mb-2">שם בית הכנסת</label>
          <input type="text" value={settings.shul_name}
            onChange={(e) => setSettings((s) => ({ ...s, shul_name: e.target.value }))}
            className="w-full p-3 text-gray-800" style={inputStyle} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-2">מהירות טיקר (שניות)</label>
            <input type="number" value={settings.ticker_speed}
              onChange={(e) => setSettings((s) => ({ ...s, ticker_speed: e.target.value }))}
              className="w-full p-3 text-gray-800" style={inputStyle} />
            <p className="text-xs text-gray-300 mt-1.5">מספר גבוה = איטי יותר</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-2">משך תצוגת תמונה (שניות)</label>
            <input type="number" value={settings.slide_duration}
              onChange={(e) => setSettings((s) => ({ ...s, slide_duration: e.target.value }))}
              className="w-full p-3 text-gray-800" style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-2">עיר למזג אוויר</label>
          <input type="text" value={settings.weather_city}
            onChange={(e) => setSettings((s) => ({ ...s, weather_city: e.target.value }))}
            className="w-full p-3 text-gray-800" style={inputStyle} />
        </div>

        <div className="space-y-3 pt-2">
          {[
            { key: 'show_date', label: 'הצגת תאריך עברי ולועזי' },
            { key: 'show_weather', label: 'הצגת מזג אוויר' },
            { key: 'show_zmanim', label: 'הצגת זמני תפילות' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative w-10 h-5 rounded-full transition-all"
                style={{ background: settings[key as keyof DisplaySettings] === 'true' ? '#891738' : 'rgba(255,255,255,0.1)' }}>
                <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                  style={{ right: settings[key as keyof DisplaySettings] === 'true' ? '2px' : 'auto', left: settings[key as keyof DisplaySettings] === 'true' ? 'auto' : '2px' }} />
                <input type="checkbox" className="sr-only"
                  checked={settings[key as keyof DisplaySettings] === 'true'}
                  onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.checked ? 'true' : 'false' }))} />
              </div>
              <span className="text-sm text-gray-600 group-hover:opacity-100 transition-opacity">{label}</span>
            </label>
          ))}
        </div>

        <button onClick={handleSave} disabled={saving}
          className="px-8 py-3 rounded-xl font-bold text-base transition-all disabled:text-gray-500 mt-4"
          style={{ background: saved ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg, #891738, #a01d45)', color: saved ? '#22c55e' : 'white' }}>
          {saving ? 'שומר...' : saved ? 'נשמר בהצלחה' : 'שמירת הגדרות'}
        </button>
      </div>
    </div>
  )
}
