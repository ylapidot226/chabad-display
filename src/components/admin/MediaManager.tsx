'use client'

import { useState, useEffect, useRef } from 'react'
import type { MediaItem } from '@/lib/types'

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export default function MediaManager() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [mode, setMode] = useState<'youtube' | 'file' | null>(null)
  const [editId, setEditId] = useState<number | null>(null)

  // YouTube form
  const [ytUrl, setYtUrl] = useState('')
  const [ytTitle, setYtTitle] = useState('')

  // File upload
  const [fileTitle, setFileTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Edit title
  const [editTitle, setEditTitle] = useState('')

  async function load() {
    const res = await fetch('/api/media')
    if (res.ok) {
      const data: MediaItem[] = await res.json()
      setItems(data.filter((m) => m.type === 'video'))
    }
  }

  useEffect(() => { load() }, [])

  function reset() {
    setMode(null); setEditId(null)
    setYtUrl(''); setYtTitle(''); setFileTitle(''); setUploadMsg(''); setEditTitle('')
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── YouTube submit ─────────────────────────────────────────────────────────
  async function submitYoutube(e: React.FormEvent) {
    e.preventDefault()
    const ytId = getYouTubeId(ytUrl)
    if (!ytId) { alert('קישור YouTube לא תקין'); return }
    await fetch('/api/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'video', url: ytUrl,
        title: ytTitle || 'סרטון YouTube',
        category: 'general', duration_seconds: 0,
        sort_order: items.length,
      }),
    })
    reset(); load()
  }

  // ── File upload ────────────────────────────────────────────────────────────
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setUploadMsg('מעלה...')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      const { url } = await res.json()
      const title = fileTitle || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
      await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'video', url, title, category: 'general', duration_seconds: 0, sort_order: items.length }),
      })
      reset(); load()
    } catch (err: unknown) {
      setUploadMsg('שגיאה: ' + (err instanceof Error ? err.message : String(err)))
      setUploading(false)
    }
  }

  // ── Edit title ─────────────────────────────────────────────────────────────
  function startEdit(item: MediaItem) {
    setEditId(item.id); setEditTitle(item.title || ''); setMode(null)
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/media', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editId, title: editTitle }),
    })
    reset(); load()
  }

  async function toggleActive(item: MediaItem) {
    await fetch('/api/media', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, active: !item.active }),
    })
    load()
  }

  async function deleteItem(id: number) {
    if (!confirm('למחוק את הסרטון?')) return
    await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  const input = { background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '10px', color: '#333' }
  const btn = { background: 'linear-gradient(135deg, #891738, #a01d45)' }

  const ytId = getYouTubeId(ytUrl)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול סרטונים</h2>
        {!mode && !editId && (
          <div className="flex gap-2">
            <button onClick={() => setMode('youtube')}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={btn}>
              + YouTube
            </button>
            <button onClick={() => setMode('file')}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #1e73be, #2980b9)' }}>
              + העלאת קובץ
            </button>
          </div>
        )}
      </div>

      {/* YouTube form */}
      {mode === 'youtube' && (
        <form onSubmit={submitYoutube} className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-lg">הוספת סרטון YouTube</h3>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">קישור YouTube</label>
            <input type="url" value={ytUrl} onChange={(e) => setYtUrl(e.target.value)}
              className="w-full p-2.5" style={input} required
              placeholder="https://www.youtube.com/watch?v=..." />
          </div>
          {ytId && (
            <div className="rounded-xl overflow-hidden" style={{ background: '#000' }}>
              <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                alt="תצוגה מקדימה" className="w-full max-h-48 object-contain" />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">כותרת</label>
            <input type="text" value={ytTitle} onChange={(e) => setYtTitle(e.target.value)}
              className="w-full p-2.5" style={input} placeholder="שם הסרטון..." />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-6 py-2.5 rounded-xl font-medium text-sm text-white" style={btn}>הוספה</button>
            <button type="button" onClick={reset} className="px-6 py-2.5 rounded-xl text-sm" style={{ background: '#f0f0f0', color: '#555' }}>ביטול</button>
          </div>
        </form>
      )}

      {/* File upload form */}
      {mode === 'file' && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-lg">העלאת קובץ וידאו</h3>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">כותרת (אופציונלי)</label>
            <input type="text" value={fileTitle} onChange={(e) => setFileTitle(e.target.value)}
              disabled={uploading} className="w-full p-2.5" style={input} placeholder="שם הסרטון..." />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">קובץ וידאו (mp4, webm, mov)</label>
            <input ref={fileRef} type="file"
              accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov"
              disabled={uploading} onChange={handleFile}
              className="w-full p-2.5 cursor-pointer" style={input} />
          </div>
          {uploadMsg && (
            <div className="text-sm px-3 py-2 rounded-lg"
              style={{ background: uploadMsg.startsWith('שגיאה') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: uploadMsg.startsWith('שגיאה') ? '#ef4444' : '#16a34a' }}>
              {uploading && <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />}
              {uploadMsg}
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={reset} disabled={uploading}
              className="px-6 py-2.5 rounded-xl text-sm" style={{ background: '#f0f0f0', color: '#555' }}>ביטול</button>
          </div>
        </div>
      )}

      {/* Edit title form */}
      {editId && (
        <form onSubmit={submitEdit} className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-lg">עריכת כותרת</h3>
          <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
            className="w-full p-2.5" style={input} placeholder="שם הסרטון..." />
          <div className="flex gap-3">
            <button type="submit" className="px-6 py-2.5 rounded-xl font-medium text-sm text-white" style={btn}>שמירה</button>
            <button type="button" onClick={reset} className="px-6 py-2.5 rounded-xl text-sm" style={{ background: '#f0f0f0', color: '#555' }}>ביטול</button>
          </div>
        </form>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const ytId = getYouTubeId(item.url)
          return (
            <div key={item.id} className={`glass-card overflow-hidden transition-opacity ${!item.active ? 'opacity-40' : ''}`}>
              <div className="aspect-video relative" style={{ background: '#111' }}>
                {ytId ? (
                  <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                    alt={item.title || ''} className="w-full h-full object-cover" />
                ) : (
                  <video src={item.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                )}
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-medium text-white"
                  style={{ background: ytId ? '#ff0000cc' : 'rgba(0,0,0,0.7)' }}>
                  {ytId ? 'YouTube' : 'קובץ'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-medium mb-3">{item.title || 'ללא כותרת'}</h3>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(item)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(30,115,190,0.15)', color: '#1e73be' }}>עריכה</button>
                  <button onClick={() => toggleActive(item)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: item.active ? 'rgba(34,197,94,0.15)' : '#f0f0f0', color: item.active ? '#22c55e' : '#999' }}>
                    {item.active ? 'פעיל' : 'כבוי'}
                  </button>
                  <button onClick={() => deleteItem(item.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>מחיקה</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {items.length === 0 && !mode && (
        <div className="text-center py-16 text-gray-300">
          <p className="text-xl mb-2">אין סרטונים</p>
          <p className="text-sm">הוסף סרטון YouTube או העלה קובץ וידאו</p>
        </div>
      )}
    </div>
  )
}
