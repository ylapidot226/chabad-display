'use client'

import { useState, useEffect } from 'react'
import type { MediaItem } from '@/lib/types'

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export default function MediaManager() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({
    url: '',
    title: '',
    sort_order: 0,
  })

  async function loadItems() {
    const res = await fetch('/api/media')
    if (res.ok) {
      const data: MediaItem[] = await res.json()
      setItems(data.filter((m) => m.type === 'video'))
    }
  }

  useEffect(() => { loadItems() }, [])

  function resetForm() {
    setForm({ url: '', title: '', sort_order: 0 })
    setEditId(null)
    setShowForm(false)
  }

  function startEdit(item: MediaItem) {
    setEditId(item.id)
    setForm({ url: item.url, title: item.title || '', sort_order: item.sort_order })
    setShowForm(true)
  }

  function handleUrlChange(url: string) {
    setForm((f) => ({ ...f, url }))
    const ytId = getYouTubeId(url)
    if (ytId && !form.title) {
      setForm((f) => ({ ...f, url, title: 'סרטון YouTube' }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body = {
      type: 'video',
      url: form.url,
      title: form.title,
      category: 'general',
      duration_seconds: 0,
      sort_order: form.sort_order,
      ...(editId ? { id: editId } : {}),
    }
    await fetch('/api/media', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    resetForm()
    loadItems()
  }

  async function toggleActive(item: MediaItem) {
    await fetch('/api/media', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, active: !item.active }),
    })
    loadItems()
  }

  async function deleteItem(id: number) {
    if (!confirm('למחוק את הסרטון?')) return
    await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    loadItems()
  }

  const inputStyle = { background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '10px', color: '#333' }

  const ytId = getYouTubeId(form.url)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול סרטונים</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #891738, #a01d45)' }}
        >
          הוספת סרטון YouTube
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">קישור YouTube</label>
            <input type="url" value={form.url} onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full p-2.5" style={inputStyle} required
              placeholder="https://www.youtube.com/watch?v=..." />
          </div>

          {/* YouTube preview */}
          {ytId && (
            <div className="rounded-xl overflow-hidden" style={{ background: '#000' }}>
              <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt="תצוגה מקדימה"
                className="w-full max-h-48 object-contain" />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-500 mb-1.5">כותרת</label>
            <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full p-2.5" style={inputStyle} placeholder="שם הסרטון..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-6 py-2.5 rounded-xl font-medium text-sm text-white" style={{ background: 'linear-gradient(135deg, #891738, #a01d45)' }}>
              {editId ? 'עדכון' : 'הוספה'}
            </button>
            <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-xl text-sm" style={{ background: '#f0f0f0', color: '#555' }}>
              ביטול
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const itemYtId = getYouTubeId(item.url)
          return (
            <div key={item.id} className={`glass-card overflow-hidden transition-opacity ${!item.active ? 'opacity-40' : ''}`}>
              <div className="aspect-video relative" style={{ background: '#111' }}>
                {itemYtId ? (
                  <img src={`https://img.youtube.com/vi/${itemYtId}/hqdefault.jpg`}
                    alt={item.title || ''} className="w-full h-full object-cover" />
                ) : (
                  <video src={item.url} className="w-full h-full object-cover" muted />
                )}
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-medium text-white"
                  style={{ background: itemYtId ? '#ff0000' : 'rgba(0,0,0,0.7)' }}>
                  {itemYtId ? 'YouTube' : 'וידאו'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-medium mb-1">{item.title || 'ללא כותרת'}</h3>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => startEdit(item)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(30,115,190,0.15)', color: '#1e73be' }}>עריכה</button>
                  <button onClick={() => toggleActive(item)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: item.active ? 'rgba(34,197,94,0.15)' : '#f0f0f0', color: item.active ? '#22c55e' : '#999' }}>
                    {item.active ? 'פעיל' : 'כבוי'}
                  </button>
                  <button onClick={() => deleteItem(item.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                    מחיקה
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-gray-300">
          <p className="text-xl mb-2">אין סרטונים</p>
          <p className="text-sm">הוסף קישורי YouTube כדי להתחיל</p>
        </div>
      )}
    </div>
  )
}
