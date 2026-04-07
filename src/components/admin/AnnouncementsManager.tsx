'use client'

import { useState, useEffect } from 'react'
import type { Announcement } from '@/lib/types'

export default function AnnouncementsManager() {
  const [items, setItems] = useState<Announcement[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ text: '', priority: 0, ends_at: '' })

  async function loadItems() {
    const res = await fetch('/api/announcements')
    if (res.ok) setItems(await res.json())
  }

  useEffect(() => { loadItems() }, [])

  function startEdit(item: Announcement) {
    setEditId(item.id)
    setForm({ text: item.text, priority: item.priority, ends_at: item.ends_at ? item.ends_at.slice(0, 16) : '' })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body = { ...form, ends_at: form.ends_at || null, ...(editId ? { id: editId } : {}) }
    await fetch('/api/announcements', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setShowForm(false)
    setEditId(null)
    setForm({ text: '', priority: 0, ends_at: '' })
    loadItems()
  }

  async function toggleActive(item: Announcement) {
    await fetch('/api/announcements', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, active: !item.active }),
    })
    loadItems()
  }

  async function deleteItem(id: number) {
    if (!confirm('למחוק את המודעה?')) return
    await fetch('/api/announcements', {
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
        <h2 className="text-2xl font-bold">ניהול מודעות</h2>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ text: '', priority: 0, ends_at: '' }) }}
          className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'linear-gradient(135deg, #891738, #a01d45)' }}
        >
          מודעה חדשה
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">טקסט המודעה</label>
            <textarea value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              className="w-full p-3 h-24 resize-none text-gray-800" style={inputStyle} required placeholder="הקלד את טקסט המודעה..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">עדיפות (גבוה = ראשון)</label>
              <input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: parseInt(e.target.value) }))}
                className="w-full p-2.5 text-gray-800" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">תוקף עד (אופציונלי)</label>
              <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                className="w-full p-2.5 text-gray-800" style={inputStyle} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-6 py-2.5 rounded-xl font-medium text-sm" style={{ background: 'linear-gradient(135deg, #891738, #a01d45)' }}>
              {editId ? 'עדכון' : 'הוספה'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} className="px-6 py-2.5 rounded-xl text-sm" style={{ background: '#f0f0f0', color: '#555' }}>
              ביטול
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className={`glass-card p-5 flex items-center gap-4 transition-opacity ${!item.active ? 'text-gray-400' : ''}`}>
            <div className="flex-1">
              <p className="text-base leading-relaxed">{item.text}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span>עדיפות: {item.priority}</span>
                {item.ends_at && <span>תוקף עד: {new Date(item.ends_at).toLocaleDateString('he-IL')}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(item)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(30,115,190,0.15)', color: '#1e73be' }}>עריכה</button>
              <button onClick={() => toggleActive(item)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: item.active ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', color: item.active ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>
                {item.active ? 'פעיל' : 'כבוי'}
              </button>
              <button onClick={() => deleteItem(item.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>מחיקה</button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-16 opacity-30">
            <p className="text-xl mb-2">אין מודעות</p>
            <p className="text-sm">הוסף מודעה חדשה להצגה על המסך</p>
          </div>
        )}
      </div>
    </div>
  )
}
