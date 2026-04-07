'use client'

import { useState, useEffect } from 'react'
import type { PrayerTime } from '@/lib/types'

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const PRESET_PRAYERS = ['שחרית', 'מנחה', 'ערבית', 'מנחה גדולה', 'שיעור', 'הדלקת נרות', 'ארוחת חג', 'יזכור', 'סעודת משיח']

type ScheduleType = 'every_day' | 'weekdays' | 'specific_day' | 'specific_date' | 'shabbat'
type TimeType = 'fixed' | 'dynamic:mincha' | 'dynamic:arvit' | 'dynamic:sunset'

const SCHEDULE_OPTIONS: { value: ScheduleType; label: string }[] = [
  { value: 'every_day', label: 'כל יום' },
  { value: 'weekdays', label: 'ימי חול (א-ו)' },
  { value: 'shabbat', label: 'שבת בלבד' },
  { value: 'specific_day', label: 'יום ספציפי' },
  { value: 'specific_date', label: 'תאריך ספציפי' },
]

const TIME_OPTIONS: { value: TimeType; label: string }[] = [
  { value: 'fixed', label: 'שעה קבועה' },
  { value: 'dynamic:mincha', label: 'רבע שעה לפני השקיעה' },
  { value: 'dynamic:arvit', label: 'צאת הכוכבים' },
  { value: 'dynamic:sunset', label: 'שקיעה' },
]

function getScheduleType(dayOfWeek: string | null): ScheduleType {
  if (!dayOfWeek) return 'every_day'
  if (/^\d{4}-\d{2}-\d{2}$/.test(dayOfWeek)) return 'specific_date'
  if (dayOfWeek === 'שבת') return 'shabbat'
  return 'specific_day'
}

function getTimeType(time: string): TimeType {
  if (time.startsWith('dynamic:')) return time as TimeType
  return 'fixed'
}

export default function PrayerTimesManager() {
  const [items, setItems] = useState<PrayerTime[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '', time: '', day_of_week: '', notes: '', sort_order: 0,
    scheduleType: 'every_day' as ScheduleType,
    timeType: 'fixed' as TimeType,
    specificDate: '',
  })

  async function loadItems() {
    const res = await fetch('/api/prayer-times')
    if (res.ok) setItems(await res.json())
  }

  useEffect(() => { loadItems() }, [])

  function startEdit(item: PrayerTime) {
    const scheduleType = getScheduleType(item.day_of_week)
    const timeType = getTimeType(item.time)
    setEditId(item.id)
    setForm({
      name: item.name,
      time: timeType === 'fixed' ? item.time : '',
      day_of_week: item.day_of_week || '',
      notes: item.notes || '',
      sort_order: item.sort_order,
      scheduleType,
      timeType,
      specificDate: scheduleType === 'specific_date' ? item.day_of_week || '' : '',
    })
    setShowForm(true)
  }

  function resetForm() {
    setForm({ name: '', time: '', day_of_week: '', notes: '', sort_order: 0, scheduleType: 'every_day', timeType: 'fixed', specificDate: '' })
    setEditId(null)
    setShowForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Build day_of_week based on schedule type
    let dayOfWeek: string | null = null
    if (form.scheduleType === 'specific_day') dayOfWeek = form.day_of_week || null
    else if (form.scheduleType === 'specific_date') dayOfWeek = form.specificDate || null
    else if (form.scheduleType === 'shabbat') dayOfWeek = 'שבת'

    // Build time
    const time = form.timeType === 'fixed' ? form.time : form.timeType

    const body = {
      name: form.name,
      time,
      day_of_week: dayOfWeek,
      notes: form.notes || null,
      sort_order: form.sort_order,
      ...(editId ? { id: editId } : {}),
    }

    // For weekdays, create 6 entries (Sun-Fri) if new
    if (form.scheduleType === 'weekdays' && !editId) {
      const weekdays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']
      for (const day of weekdays) {
        await fetch('/api/prayer-times', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, day_of_week: day }),
        })
      }
    } else {
      await fetch('/api/prayer-times', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }

    resetForm()
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
    background: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '10px',
    color: '#333',
  }

  function formatSchedule(item: PrayerTime): string {
    if (!item.day_of_week) return 'כל יום'
    if (/^\d{4}-\d{2}-\d{2}$/.test(item.day_of_week)) {
      return `תאריך: ${item.day_of_week.split('-').reverse().join('/')}`
    }
    return `יום ${item.day_of_week}`
  }

  function formatTime(item: PrayerTime): string {
    if (item.time === 'dynamic:mincha') return 'רבע שעה לפני השקיעה'
    if (item.time === 'dynamic:arvit') return 'צאת הכוכבים'
    if (item.time === 'dynamic:sunset') return 'שקיעה'
    return item.time
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול זמני תפילות</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #891738, #a01d45)' }}
        >
          זמן תפילה חדש
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {/* Prayer name */}
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">שם התפילה / אירוע</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full p-2.5" style={inputStyle} required placeholder="שחרית, מנחה..." />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESET_PRAYERS.map((p) => (
                <button key={p} type="button" onClick={() => setForm((f) => ({ ...f, name: p }))}
                  className="px-2.5 py-1 rounded-lg text-xs transition-all"
                  style={{ background: form.name === p ? 'rgba(137,23,56,0.15)' : '#f0f0f0', border: form.name === p ? '1px solid rgba(137,23,56,0.4)' : '1px solid transparent', color: form.name === p ? '#891738' : '#666' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Time type */}
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">סוג זמן</label>
              <select value={form.timeType} onChange={(e) => setForm((f) => ({ ...f, timeType: e.target.value as TimeType }))}
                className="w-full p-2.5" style={inputStyle}>
                {TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Fixed time input */}
            {form.timeType === 'fixed' && (
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">שעה</label>
                <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className="w-full p-2.5" style={inputStyle} required />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Schedule type */}
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">מתי להציג</label>
              <select value={form.scheduleType} onChange={(e) => setForm((f) => ({ ...f, scheduleType: e.target.value as ScheduleType }))}
                className="w-full p-2.5" style={inputStyle}>
                {SCHEDULE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Specific day selector */}
            {form.scheduleType === 'specific_day' && (
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">יום</label>
                <select value={form.day_of_week} onChange={(e) => setForm((f) => ({ ...f, day_of_week: e.target.value }))}
                  className="w-full p-2.5" style={inputStyle}>
                  <option value="">בחר יום</option>
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}

            {/* Specific date input */}
            {form.scheduleType === 'specific_date' && (
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">תאריך</label>
                <input type="date" value={form.specificDate} onChange={(e) => setForm((f) => ({ ...f, specificDate: e.target.value }))}
                  className="w-full p-2.5" style={inputStyle} required />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">הערות</label>
              <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full p-2.5" style={inputStyle} placeholder="אופציונלי..." />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">סדר תצוגה</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                className="w-full p-2.5" style={inputStyle} />
            </div>
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

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className={`glass-card p-5 flex items-center gap-5 transition-opacity ${!item.active ? 'opacity-40' : ''}`}>
            <div className="text-2xl font-bold w-36 text-center" style={{ color: '#891738' }}>
              {formatTime(item)}
            </div>
            <div className="w-px h-10 self-center" style={{ background: '#e5e5e5' }} />
            <div className="flex-1">
              <p className="text-lg font-medium">{item.name}</p>
              <div className="flex gap-4 mt-1 text-xs text-gray-400">
                <span>{formatSchedule(item)}</span>
                {item.notes && <span>{item.notes}</span>}
              </div>
            </div>
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
        ))}

        {items.length === 0 && (
          <div className="text-center py-16 text-gray-300">
            <p className="text-xl mb-2">אין זמני תפילות</p>
            <p className="text-sm">הוסף זמני תפילות להצגה על המסך</p>
          </div>
        )}
      </div>
    </div>
  )
}
