'use client'

import { useState, useEffect } from 'react'
import type { MediaItem } from '@/lib/types'

export default function MediaManager() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    type: 'image' as 'image' | 'video',
    url: '',
    title: '',
    description: '',
    category: 'general',
    duration_seconds: 10,
    sort_order: 0,
  })

  async function loadItems() {
    const res = await fetch('/api/media')
    if (res.ok) setItems(await res.json())
  }

  useEffect(() => { loadItems() }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (res.ok) {
      const { url } = await res.json()
      const isVideo = file.type.startsWith('video/')
      setForm((f) => ({ ...f, url, type: isVideo ? 'video' : 'image', title: file.name.split('.')[0] }))
      setShowForm(true)
    }
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ type: 'image', url: '', title: '', description: '', category: 'general', duration_seconds: 10, sort_order: 0 })
      loadItems()
    }
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
    if (!confirm('למחוק את הפריט?')) return
    await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    loadItems()
  }

  const inputStyle = {
    background: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '10px',
    color: '#333',
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול מדיה</h2>
        <div className="flex gap-3">
          <label className="cursor-pointer px-5 py-2.5 rounded-xl text-sm font-medium transition-all" style={{
            background: 'linear-gradient(135deg, #891738, #a01d45)',
          }}>
            {uploading ? 'מעלה...' : 'העלאת קובץ'}
            <input type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" />
          </label>
          <button
            onClick={() => { setShowForm(true); setForm((f) => ({ ...f, url: '', type: 'image' })) }}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(30,115,190,0.2)', border: '1px solid rgba(30,115,190,0.3)' }}
          >
            הוספה מ-URL
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">סוג</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'image' | 'video' }))}
                className="w-full p-2.5" style={inputStyle}>
                <option value="image">תמונה</option>
                <option value="video">וידאו</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">קטגוריה</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full p-2.5" style={inputStyle}>
                <option value="general">כללי</option>
                <option value="event">אירוע</option>
                <option value="promo">פרסום</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">URL</label>
            <input type="url" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              className="w-full p-2.5" style={inputStyle} required />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">כותרת</label>
            <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full p-2.5" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">משך תצוגה (שניות)</label>
              <input type="number" value={form.duration_seconds} onChange={(e) => setForm((f) => ({ ...f, duration_seconds: parseInt(e.target.value) }))}
                className="w-full p-2.5" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">סדר</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) }))}
                className="w-full p-2.5" style={inputStyle} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-6 py-2.5 rounded-xl font-medium text-sm" style={{ background: 'linear-gradient(135deg, #891738, #a01d45)' }}>
              שמירה
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl text-sm" style={{ background: '#f0f0f0', color: '#555' }}>
              ביטול
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className={`glass-card overflow-hidden transition-opacity ${!item.active ? 'text-gray-400' : ''}`}>
            <div className="aspect-video relative" style={{ background: 'rgba(255,255,255,0.03)' }}>
              {item.type === 'video' ? (
                <video src={item.url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={item.url} alt={item.title || ''} className="w-full h-full object-cover" />
              )}
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                {item.type === 'video' ? 'וידאו' : 'תמונה'}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-medium mb-1">{item.title || 'ללא כותרת'}</h3>
              <p className="text-sm text-gray-400">{item.category} • סדר: {item.sort_order}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => toggleActive(item)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: item.active ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', color: item.active ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>
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
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-gray-300">
          <p className="text-xl mb-2">אין פריטי מדיה</p>
          <p className="text-sm">העלה תמונות או וידאו כדי להתחיל</p>
        </div>
      )}
    </div>
  )
}
