'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Announcement, MediaItem } from '@/lib/types'

type AnnouncementType = 'text' | 'image'

export default function AnnouncementsManager() {
  const [textItems, setTextItems] = useState<Announcement[]>([])
  const [imageItems, setImageItems] = useState<MediaItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editType, setEditType] = useState<AnnouncementType>('text')
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    type: 'text' as AnnouncementType,
    text: '',
    priority: 0,
    ends_at: '',
    // Image fields
    url: '',
    title: '',
    duration_seconds: 10,
    sort_order: 0,
  })

  async function loadItems() {
    const [announcementsRes, mediaRes] = await Promise.all([
      fetch('/api/announcements'),
      fetch('/api/media'),
    ])
    if (announcementsRes.ok) setTextItems(await announcementsRes.json())
    if (mediaRes.ok) {
      const media: MediaItem[] = await mediaRes.json()
      setImageItems(media.filter((m) => m.type === 'image'))
    }
  }

  useEffect(() => { loadItems() }, [])

  function resetForm() {
    setForm({ type: 'text', text: '', priority: 0, ends_at: '', url: '', title: '', duration_seconds: 10, sort_order: 0 })
    setEditId(null)
    setEditType('text')
    setShowForm(false)
  }

  function startEditText(item: Announcement) {
    setEditId(item.id)
    setEditType('text')
    setForm({ ...form, type: 'text', text: item.text, priority: item.priority, ends_at: item.ends_at ? item.ends_at.slice(0, 16) : '' })
    setShowForm(true)
  }

  function startEditImage(item: MediaItem) {
    setEditId(item.id)
    setEditType('image')
    setForm({ ...form, type: 'image', url: item.url, title: item.title || '', duration_seconds: item.duration_seconds, sort_order: item.sort_order })
    setShowForm(true)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = getSupabase()
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage.from('media').upload(fileName, file, { contentType: file.type })
      if (error) throw new Error(error.message)

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName)
      setForm((f) => ({ ...f, type: 'image', url: urlData.publicUrl, title: file.name.split('.')[0] }))
      setShowForm(true)
    } catch (err) {
      alert('שגיאה בהעלאה: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (form.type === 'text') {
      const body = { text: form.text, priority: form.priority, ends_at: form.ends_at || null, ...(editId && editType === 'text' ? { id: editId } : {}) }
      await fetch('/api/announcements', {
        method: editId && editType === 'text' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } else {
      const body = {
        type: 'image',
        url: form.url,
        title: form.title,
        category: 'flyer',
        duration_seconds: form.duration_seconds,
        sort_order: form.sort_order,
        ...(editId && editType === 'image' ? { id: editId } : {}),
      }
      await fetch('/api/media', {
        method: editId && editType === 'image' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }

    resetForm()
    loadItems()
  }

  async function toggleActiveText(item: Announcement) {
    await fetch('/api/announcements', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, active: !item.active }),
    })
    loadItems()
  }

  async function toggleActiveImage(item: MediaItem) {
    await fetch('/api/media', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, active: !item.active }),
    })
    loadItems()
  }

  async function deleteText(id: number) {
    if (!confirm('למחוק את המודעה?')) return
    await fetch('/api/announcements', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadItems()
  }

  async function deleteImage(id: number) {
    if (!confirm('למחוק את הפלייר?')) return
    await fetch('/api/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadItems()
  }

  const inputStyle = { background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '10px', color: '#333' }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול מודעות ופלייירים</h2>
        <div className="flex gap-3">
          <label className="cursor-pointer px-5 py-2.5 rounded-xl text-sm font-medium text-white" style={{
            background: 'linear-gradient(135deg, #1e73be, #2980b9)',
          }}>
            {uploading ? 'מעלה...' : 'העלאת פלייר'}
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
          <button
            onClick={() => { resetForm(); setForm((f) => ({ ...f, type: 'text' })); setShowForm(true) }}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #891738, #a01d45)' }}
          >
            מודעת טקסט
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {/* Type selector */}
          <div className="flex gap-3 mb-2">
            <button type="button" onClick={() => setForm((f) => ({ ...f, type: 'text' }))}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: form.type === 'text' ? 'rgba(137,23,56,0.15)' : '#f0f0f0', color: form.type === 'text' ? '#891738' : '#666', border: form.type === 'text' ? '1px solid rgba(137,23,56,0.3)' : '1px solid transparent' }}>
              מודעת טקסט
            </button>
            <button type="button" onClick={() => setForm((f) => ({ ...f, type: 'image' }))}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: form.type === 'image' ? 'rgba(30,115,190,0.15)' : '#f0f0f0', color: form.type === 'image' ? '#1e73be' : '#666', border: form.type === 'image' ? '1px solid rgba(30,115,190,0.3)' : '1px solid transparent' }}>
              פלייר / תמונה
            </button>
          </div>

          {form.type === 'text' ? (
            <>
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">טקסט המודעה</label>
                <textarea value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                  className="w-full p-3 h-24 resize-none" style={inputStyle} required placeholder="הקלד את טקסט המודעה..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">עדיפות (גבוה = ראשון)</label>
                  <input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                    className="w-full p-2.5" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">תוקף עד (אופציונלי)</label>
                  <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                    className="w-full p-2.5" style={inputStyle} />
                </div>
              </div>
            </>
          ) : (
            <>
              {form.url ? (
                <div className="rounded-xl overflow-hidden" style={{ background: '#f0f0f0' }}>
                  <img src={form.url} alt="תצוגה מקדימה" className="w-full max-h-64 object-contain" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">URL של תמונה</label>
                  <input type="url" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                    className="w-full p-2.5" style={inputStyle} required placeholder="https://..." />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">כותרת</label>
                  <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full p-2.5" style={inputStyle} placeholder="שם הפלייר..." />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">משך תצוגה (שניות)</label>
                  <input type="number" value={form.duration_seconds} onChange={(e) => setForm((f) => ({ ...f, duration_seconds: parseInt(e.target.value) || 10 }))}
                    className="w-full p-2.5" style={inputStyle} />
                </div>
              </div>
            </>
          )}

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

      {/* Flyer images */}
      {imageItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-600">פלייירים ותמונות</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {imageItems.map((item) => (
              <div key={item.id} className={`glass-card overflow-hidden transition-opacity ${!item.active ? 'opacity-40' : ''}`}>
                <div className="aspect-video relative" style={{ background: '#f5f5f5' }}>
                  <img src={item.url} alt={item.title || ''} className="w-full h-full object-contain" />
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-1">{item.title || 'ללא כותרת'}</h3>
                  <p className="text-sm text-gray-400">{item.duration_seconds} שניות</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => startEditImage(item)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: 'rgba(30,115,190,0.15)', color: '#1e73be' }}>עריכה</button>
                    <button onClick={() => toggleActiveImage(item)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: item.active ? 'rgba(34,197,94,0.15)' : '#f0f0f0', color: item.active ? '#22c55e' : '#999' }}>
                      {item.active ? 'פעיל' : 'כבוי'}
                    </button>
                    <button onClick={() => deleteImage(item.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>מחיקה</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text announcements */}
      <div>
        {imageItems.length > 0 && <h3 className="text-lg font-semibold mb-3 text-gray-600">מודעות טקסט</h3>}
        <div className="space-y-3">
          {textItems.map((item) => (
            <div key={item.id} className={`glass-card p-5 flex items-center gap-4 transition-opacity ${!item.active ? 'opacity-40' : ''}`}>
              <div className="flex-1">
                <p className="text-base leading-relaxed">{item.text}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  <span>עדיפות: {item.priority}</span>
                  {item.ends_at && <span>תוקף עד: {new Date(item.ends_at).toLocaleDateString('he-IL')}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEditText(item)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(30,115,190,0.15)', color: '#1e73be' }}>עריכה</button>
                <button onClick={() => toggleActiveText(item)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: item.active ? 'rgba(34,197,94,0.15)' : '#f0f0f0', color: item.active ? '#22c55e' : '#999' }}>
                  {item.active ? 'פעיל' : 'כבוי'}
                </button>
                <button onClick={() => deleteText(item.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>מחיקה</button>
              </div>
            </div>
          ))}

          {textItems.length === 0 && imageItems.length === 0 && (
            <div className="text-center py-16 text-gray-300">
              <p className="text-xl mb-2">אין מודעות</p>
              <p className="text-sm">הוסף מודעת טקסט או העלה פלייר</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
