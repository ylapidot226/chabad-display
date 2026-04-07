'use client'

import { useState, useEffect } from 'react'
import type { PrayerTime } from '@/lib/types'

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const PRESET_PRAYERS = ['שחרית', 'מנחה', 'ערבית', 'מנחה גדולה', 'שיעור', 'הדלקת נרות', 'ארוחת חג', 'יזכור', 'סעודת משיח']

type ScheduleType = 'every_day' | 'weekdays' | 'specific_day' | 'specific_date' | 'shabbat'
type TimeType = 'fixed' | 'dynamic:mincha' | 'dynamic:arvit' | 'dynamic:sunset'
type FilterType = 'all' | 'weekday' | 'shabbat' | 'holiday'

const SCHEDULE_OPTIONS: { value: ScheduleType; label: string }[] = [
  { value: 'every_day', label: 'כל יום' },
  { value: 'weekdays', label: 'ימי חול (א-ו)' },
  { value: 'shabbat', label: 'שבת בלבד' },
  { value: 'specific_day', label: 'יום ספציפי' },
  { value: 'specific_date', label: 'תאריך ספציפי (חגים)' },
]

const TIME_OPTIONS: { value: TimeType; label: string }[] = [
  { value: 'fixed', label: 'שעה קבועה' },
  { value: 'dynamic:mincha', label: 'רבע שעה לפני השקיעה' },
  { value: 'dynamic:arvit', label: 'צאת הכוכבים' },
  { value: 'dynamic:sunset', label: 'שקיעה' },
]

const FILTER_TABS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'weekday', label: 'ימי חול' },
  { value: 'shabbat', label: 'שבת' },
  { value: 'holiday', label: 'חגים / תאריכים' },
]

function getCategory(item: PrayerTime): 'weekday' | 'shabbat' | 'holiday' | 'every_day' {
  if (!item.day_of_week) {
    if (item.notes?.includes('[WEEKDAY_ONLY]')) return 'weekday'
    return 'every_day'
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(item.day_of_week)) return 'holiday'
  if (item.day_of_week === 'שבת') return 'shabbat'
  return 'weekday'
}

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
  const [filter, setFilter] = useState<FilterType>('all')
  const [form, setForm] = useState({
    name: '', time: '', day_of_week: '', notes: '', sort_order: 0,
    scheduleType: 'every_day' as ScheduleType,
    timeType: 'fixed' as TimeType,
    specificDate: '',
    weekdayOnly: false,
  })

  async function loadItems() {
    const res = await fetch('/api/prayer-times')
    if (res.ok) setItems(await res.json())
  }

  useEffect(() => { loadItems() }, [])

  function startEdit(item: PrayerTime) {
    const scheduleType = getScheduleType(item.day_of_week)
    const timeType = getTimeType(item.time)
    const weekdayOnly = item.notes?.includes('[WEEKDAY_ONLY]') || false
    const cleanNotes = (item.notes || '').replace('[WEEKDAY_ONLY]', '').trim()
    setEditId(item.id)
    setForm({
      name: item.name,
      time: timeType === 'fixed' ? item.time : '',
      day_of_week: item.day_of_week || '',
      notes: cleanNotes,
      sort_order: item.sort_order,
      scheduleType,
      timeType,
      specificDate: scheduleType === 'specific_date' ? item.day_of_week || '' : '',
      weekdayOnly,
    })
    setShowForm(true)
  }

  function resetForm() {
    setForm({ name: '', time: '', day_of_week: '', notes: '', sort_order: 0, scheduleType: 'every_day', timeType: 'fixed', specificDate: '', weekdayOnly: false })
    setEditId(null)
    setShowForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    let dayOfWeek: string | null = null
    if (form.scheduleType === 'specific_day') dayOfWeek = form.day_of_week || null
    else if (form.scheduleType === 'specific_date') dayOfWeek = form.specificDate || null
    else if (form.scheduleType === 'shabbat') dayOfWeek = 'שבת'

    const time = form.timeType === 'fixed' ? form.time : form.timeType

    // Build notes with weekday marker
    let notes = form.notes || ''
    if (form.weekdayOnly) notes = '[WEEKDAY_ONLY]' + (notes ? ' ' + notes : '')
    if (!notes) notes = ''

    const body = {
      name: form.name,
      time,
      day_of_week: dayOfWeek,
      notes: notes || null,
      sort_order: form.sort_order,
      ...(editId ? { id: editId } : {}),
    }

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

  const inputStyle = { background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '10px', color: '#333' }

  function formatSchedule(item: PrayerTime): string {
    if (!item.day_of_week) {
      if (item.notes?.includes('[WEEKDAY_ONLY]')) return 'כל יום (חול בלבד)'
      return 'כל יום'
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(item.day_of_week)) {
      return `תאריך: ${item.day_of_week.split('-').reverse().join('/')}`
    }
    return `יום ${item.day_of_week}`
  }

  function formatTime(item: PrayerTime): string {
    if (item.time === 'dynamic:mincha') return 'לפני שקיעה'
    if (item.time === 'dynamic:arvit') return 'צאת הכוכבים'
    if (item.time === 'dynamic:sunset') return 'שקיעה'
    return item.time
  }

  function formatNotes(item: PrayerTime): string {
    return (item.notes || '').replace('[WEEKDAY_ONLY]', '').trim()
  }

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true
    const cat = getCategory(item)
    if (filter === 'weekday') return cat === 'weekday' || cat === 'every_day'
    if (filter === 'shabbat') return cat === 'shabbat' || (cat === 'every_day' && !item.notes?.includes('[WEEKDAY_ONLY]'))
    if (filter === 'holiday') return cat === 'holiday'
    return true
  })

  // Group items
  const weekdayItems = filteredItems.filter((i) => { const c = getCategory(i); return c === 'weekday' || c === 'every_day' })
  const shabbatItems = filteredItems.filter((i) => getCategory(i) === 'shabbat')
  const holidayItems = filteredItems.filter((i) => getCategory(i) === 'holiday')

  // Group holiday items by date
  const holidayByDate: Record<string, PrayerTime[]> = {}
  holidayItems.forEach((item) => {
    const date = item.day_of_week || 'unknown'
    if (!holidayByDate[date]) holidayByDate[date] = []
    holidayByDate[date].push(item)
  })

  const showGroups = filter === 'all'

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

      {/* Filter tabs */}
      <div className="flex gap-2">
        {FILTER_TABS.map((tab) => (
          <button key={tab.value} onClick={() => setFilter(tab.value)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: filter === tab.value ? '#891738' : '#f0f0f0',
              color: filter === tab.value ? '#fff' : '#666',
            }}>
            {tab.label}
            {tab.value !== 'all' && (
              <span className="mr-1.5 text-xs" style={{ opacity: 0.7 }}>
                ({items.filter((i) => {
                  const c = getCategory(i)
                  if (tab.value === 'weekday') return c === 'weekday' || c === 'every_day'
                  if (tab.value === 'shabbat') return c === 'shabbat'
                  if (tab.value === 'holiday') return c === 'holiday'
                  return false
                }).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
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
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">סוג זמן</label>
              <select value={form.timeType} onChange={(e) => setForm((f) => ({ ...f, timeType: e.target.value as TimeType }))}
                className="w-full p-2.5" style={inputStyle}>
                {TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {form.timeType === 'fixed' && (
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">שעה</label>
                <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className="w-full p-2.5" style={inputStyle} required />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">מתי להציג</label>
              <select value={form.scheduleType} onChange={(e) => setForm((f) => ({ ...f, scheduleType: e.target.value as ScheduleType }))}
                className="w-full p-2.5" style={inputStyle}>
                {SCHEDULE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
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
            {form.scheduleType === 'specific_date' && (
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">תאריך</label>
                <input type="date" value={form.specificDate} onChange={(e) => setForm((f) => ({ ...f, specificDate: e.target.value }))}
                  className="w-full p-2.5" style={inputStyle} required />
              </div>
            )}
          </div>

          {/* Weekday only toggle */}
          {(form.scheduleType === 'every_day' || form.scheduleType === 'weekdays') && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative w-10 h-5 rounded-full transition-all"
                style={{ background: form.weekdayOnly ? '#891738' : '#e0e0e0' }}>
                <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all shadow"
                  style={{ right: form.weekdayOnly ? '2px' : 'auto', left: form.weekdayOnly ? 'auto' : '2px' }} />
                <input type="checkbox" className="sr-only" checked={form.weekdayOnly}
                  onChange={(e) => setForm((f) => ({ ...f, weekdayOnly: e.target.checked }))} />
              </div>
              <span className="text-sm text-gray-600">חול בלבד (לא יוצג בשבתות וחגים)</span>
            </label>
          )}

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

      {/* Grouped display */}
      {showGroups ? (
        <div className="space-y-8">
          {/* Weekday section */}
          {weekdayItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
                ימי חול
              </h3>
              <div className="space-y-2">
                {weekdayItems.map((item) => renderItem(item))}
              </div>
            </div>
          )}

          {/* Shabbat section */}
          {shabbatItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: '#1e73be' }} />
                שבת
              </h3>
              <div className="space-y-2">
                {shabbatItems.map((item) => renderItem(item))}
              </div>
            </div>
          )}

          {/* Holiday section by date */}
          {Object.keys(holidayByDate).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: '#ffb400' }} />
                חגים / תאריכים ספציפיים
              </h3>
              {Object.entries(holidayByDate).map(([date, dateItems]) => (
                <div key={date} className="mb-4">
                  <p className="text-sm font-medium text-gray-500 mb-2 px-1">
                    {date.split('-').reverse().join('/')}
                  </p>
                  <div className="space-y-2">
                    {dateItems.map((item) => renderItem(item))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => renderItem(item))}
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="text-center py-16 text-gray-300">
          <p className="text-xl mb-2">אין זמני תפילות</p>
          <p className="text-sm">הוסף זמני תפילות להצגה על המסך</p>
        </div>
      )}
    </div>
  )

  async function toggleWeekdayOnly(item: PrayerTime) {
    const isWeekday = item.notes?.includes('[WEEKDAY_ONLY]')
    let newNotes: string | null
    if (isWeekday) {
      newNotes = (item.notes || '').replace('[WEEKDAY_ONLY]', '').trim() || null
    } else {
      newNotes = '[WEEKDAY_ONLY]' + (item.notes ? ' ' + item.notes : '')
    }
    await fetch('/api/prayer-times', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, notes: newNotes }),
    })
    loadItems()
  }

  function renderItem(item: PrayerTime) {
    const cat = getCategory(item)
    const catColor = cat === 'holiday' ? '#ffb400' : cat === 'shabbat' ? '#1e73be' : cat === 'weekday' ? '#22c55e' : '#999'
    const catLabel = cat === 'holiday' ? 'חג' : cat === 'shabbat' ? 'שבת' : cat === 'weekday' ? 'חול' : 'כל יום'
    const isWeekdayOnly = item.notes?.includes('[WEEKDAY_ONLY]')
    const notes = formatNotes(item)

    return (
      <div key={item.id} className={`glass-card p-4 flex items-center gap-4 transition-opacity ${!item.active ? 'opacity-40' : ''}`}>
        <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: catColor }} />
        <div className="text-xl font-bold w-28 text-center flex-shrink-0" style={{ color: '#891738' }}>
          {formatTime(item)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-base font-medium">{item.name}</p>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: catColor + '20', color: catColor }}>
              {catLabel}
            </span>
          </div>
          <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
            <span>{formatSchedule(item)}</span>
            {notes && <span>{notes}</span>}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
          {/* Quick weekday-only toggle for "every day" items */}
          {!item.day_of_week && (
            <button onClick={() => toggleWeekdayOnly(item)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: isWeekdayOnly ? 'rgba(34,197,94,0.15)' : '#f5f5f5', color: isWeekdayOnly ? '#22c55e' : '#aaa', border: isWeekdayOnly ? '1px solid rgba(34,197,94,0.3)' : '1px solid #e5e5e5' }}>
              {isWeekdayOnly ? '✓ חול בלבד' : 'חול בלבד'}
            </button>
          )}
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
    )
  }
}
