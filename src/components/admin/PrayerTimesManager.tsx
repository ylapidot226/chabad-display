'use client'

import { useState, useEffect } from 'react'
import type { PrayerTime } from '@/lib/types'

const DAYS = ['', 'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const PRESET_PRAYERS = ['שחרית', 'מנחה', 'ערבית', 'מנחה גדולה', 'שיעור']

export default function PrayerTimesManager() {
  const [items, setItems] = useState<PrayerTime[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', time: '', day_of_week: '', notes: '', sort_order: 0 })

  async function loadItems() {
    const res = await fetch('/api/prayer-times')
    if (res.ok) setItems(await res.json())
  }

  useEffect(() => { loadItems() }, [])

  function startEdit(item: PrayerTime) {
    setEditId(item.id)
    setForm({ name: item.name, time: item.time, day_of_week: item.day_of_week || '', notes: item.notes || '', sort_order: item.sort_order })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body = { ...form, day_of_week: form.day_of_week || null, notes: form.notes || null, ...(editId ? { id: editId } : {}) }
    await fetch('/api/prayer-times', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setShowForm(false)
    setEditId(null)
    setForm({ name: '', time: '', day_of_week: '', notes: '', sort_order: 0 })
    loadItems()
  }

  async function toggleActive(item: PrayerTime) {
    await fetch('/api/prayer-times', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, active: !item.active }),
    })
    loadItems()
  }

  async function deleteItem(id: number) {
    if (!confirm('למחוק את זמן התפילה?')) return
    await fetch('/api/prayer-times', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    loadItems()
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול זמני תפילות</h2>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', time: '', day_of_week: '', notes: '', sort_order: 0 }) }}
          className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'linear-gradient(135deg, #891738, #a01d45)' }}
        >
          זמן תפילה חדש
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm opacity-50 mb-1.5">שם התפילה</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full p-2.5 text-white" style={inputStyle} required placeholder="שחרית, מנחה..." />
              <div className="flex gap-1.5 mt-2">
                {PRESET_PRAYERS.map((p) => (
                  <button key={p} type="button" onClick={() => setForm((f) => ({ ...f, name: p }))}
                    className="px-2.5 py-1 rounded-lg text-xs transition-all"
                    style={{ background: form.name === p ? 'rgba(137,23,56,0.3)' : 'rgba(255,255,255,0.05)', border: form.name === p ? '1px solid rgba(137,23,56,0.5)' : '1px solid transparent' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm opacity-50 mb-1.5">שעה</label>
              <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full p-2.5 text-white" style={inputStyle} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm opacity-50 mb-1.5">יום (ריק = כל יום)</label>
              <select value={form.day_of_week} onChange={(e) => setForm((f) => ({ ...f, day_of_week: e.target.value }))}
                className="w-full p-2.5 text-white" style={inputStyle}>
                {DAYS.map((d) => (<option key={d} value={d}>{d || 'כל יום'}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm opacity-50 mb-1.5">הערות</label>
              <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full p-2.5 text-white" style={inputStyle} placeholder="אופציונלי..." />
            </div>
            <div>
              <label className="block text-sm opacity-50 mb-1.5">סדר</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) }))}
                className="w-full p-2.5 text-white" style={inputStyle} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-6 py-2.5 rounded-xl font-medium text-sm" style={{ background: 'linear-gradient(135deg, #891738, #a01d45)' }}>
              {editId ? 'עדכון' : 'הוספה'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} className="px-6 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)' }}>
              ביטול
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className={`glass-card p-5 flex items-center gap-5 transition-opacity ${!item.active ? 'opacity-40' : ''}`}>
            <div className="text-3xl font-bold w-20 text-center" style={{ color: '#ffb400' }}>{item.time}</div>
            <div className="w-px h-10 self-center" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="flex-1">
              <p className="text-lg font-medium">{item.name}</p>
              <div className="flex gap-4 mt-1 text-xs opacity-40">
                {item.day_of_week ? <span>יום {item.day_of_week}</span> : <span>כל יום</span>}
                {item.notes && <span>{item.notes}</span>}
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
            <p className="text-xl mb-2">אין זמני תפילות</p>
            <p className="text-sm">הוסף זמני תפילות להצגה על המסך</p>
          </div>
        )}
      </div>
    </div>
  )
}
