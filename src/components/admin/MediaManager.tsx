'use client'

import { useState, useEffect, useRef } from 'react'
import type { MediaItem } from '@/lib/types'

export default function MediaManager() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function loadItems() {
    const res = await fetch('/api/media')
    if (res.ok) {
      const data: MediaItem[] = await res.json()
      setItems(data.filter((m) => m.type === 'video'))
    }
  }

  useEffect(() => { loadItems() }, [])

  function resetForm() {
    setTitle('')
    setEditId(null)
    setEditUrl('')
    setShowForm(false)
    setUploadProgress('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function startEdit(item: MediaItem) {
    setEditId(item.id)
    setTitle(item.title || '')
    setEditUrl(item.url)
    setShowForm(true)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadProgress('מעלה קובץ...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'שגיאה בהעלאה')
      }
      const { url } = await res.json()

      // Auto-fill title from filename if empty
      const guessedTitle = title || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')

      const body = {
        type: 'video',
        url,
        title: guessedTitle,
        category: 'general',
        duration_seconds: 0,
        sort_order: items.length,
      }
      await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      resetForm()
      loadItems()
    } catch (err: unknown) {
      setUploadProgress('שגיאה: ' + (err instanceof Error ? err.message : String(err)))
      setUploading(false)
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editId) return
    await fetch('/api/media', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editId, title }),
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול סרטונים</h2>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #891738, #a01d45)' }}
          >
            + העלאת סרטון
          </button>
        )}
      </div>

      {/* Upload form */}
      {showForm && !editId && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-lg">העלאת סרטון חדש</h3>

          {/* File picker */}
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">קובץ וידאו (mp4, webm, mov)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov"
              disabled={uploading}
              onChange={handleFileUpload}
              className="w-full p-2.5 cursor-pointer"
              style={inputStyle}
            />
          </div>

          {/* Optional title */}
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">כותרת (אופציונלי)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              className="w-full p-2.5"
              style={inputStyle}
              placeholder="שם הסרטון..."
            />
          </div>

          {uploadProgress && (
            <div className="text-sm px-3 py-2 rounded-lg"
              style={{
                background: uploadProgress.startsWith('שגיאה') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                color: uploadProgress.startsWith('שגיאה') ? '#ef4444' : '#16a34a',
              }}>
              {uploadProgress}
            </div>
          )}

          {uploading && (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              מעלה...
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={resetForm} disabled={uploading}
              className="px-6 py-2.5 rounded-xl text-sm" style={{ background: '#f0f0f0', color: '#555' }}>
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Edit title form */}
      {showForm && editId && (
        <form onSubmit={handleEditSubmit} className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-lg">עריכת כותרת</h3>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">כותרת</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5" style={inputStyle} placeholder="שם הסרטון..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-6 py-2.5 rounded-xl font-medium text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #891738, #a01d45)' }}>שמירה</button>
            <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-xl text-sm"
              style={{ background: '#f0f0f0', color: '#555' }}>ביטול</button>
          </div>
        </form>
      )}

      {/* Video grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className={`glass-card overflow-hidden transition-opacity ${!item.active ? 'opacity-40' : ''}`}>
            <div className="aspect-video relative" style={{ background: '#111' }}>
              <video src={item.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-medium text-white"
                style={{ background: 'rgba(0,0,0,0.7)' }}>
                וידאו
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-medium mb-1">{item.title || 'ללא כותרת'}</h3>
              {item.duration_seconds > 0 && (
                <p className="text-sm text-gray-400">
                  {Math.floor(item.duration_seconds / 60)}:{(item.duration_seconds % 60).toString().padStart(2, '0')} דקות
                </p>
              )}
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
        ))}
      </div>

      {items.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-300">
          <p className="text-xl mb-2">אין סרטונים</p>
          <p className="text-sm">לחץ על &quot;העלאת סרטון&quot; להוספה</p>
        </div>
      )}
    </div>
  )
}
