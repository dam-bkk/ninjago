'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, X, Check, ChevronLeft, Power, ChevronRight } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const SESSION_TYPES = [
  { value: 'NINJA_CLASS',   label: 'Ninja Class' },
  { value: 'BJJ_COMBO',     label: 'BJJ Combo' },
  { value: 'CAMP_REGULAR',  label: 'Camp Regular' },
  { value: 'CAMP_EXTENDED', label: 'Camp Extended' },
]

const CREDIT_TYPES = [
  { value: 'CLASS',         label: 'Class credit' },
  { value: 'CAMP',          label: 'Camp credit' },
  { value: 'CAMP_EXTENDED', label: 'Extended credit' },
]

const PERIOD_TYPES = [
  { value: 'REGULAR',  label: 'Regular' },
  { value: 'VACATION', label: 'Vacation' },
  { value: 'SPECIAL',  label: 'Special' },
]

const CREDIT_COLORS: Record<string, string> = {
  CLASS: '#00C2E0',
  CAMP: '#CCFF00',
  CAMP_EXTENDED: '#FFB400',
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const PERIOD_OVERRIDE_TYPES = [
  { value: 'VACATION', label: 'Vacation', bg: '#EFF6FF', color: '#2563EB' },
  { value: 'SPECIAL',  label: 'Special',  bg: '#FFF7ED', color: '#C2410C' },
]

type Location = { id: number; name: string }
type CalendarOverride = { id: number; date: Date | string; periodType: string; note: string | null }
type Session = {
  id: number; name: string
  sessionType: string; creditType: string
  dayOfWeek: number | null; startTime: string; endTime: string
  includeLunch: boolean; periodType: string
  maxCapacity: number | null; active: boolean
  location: { id: number; name: string }
}

type FormData = {
  locationId: string; name: string; sessionType: string; creditType: string
  dayOfWeek: string; startTime: string; endTime: string
  includeLunch: boolean; periodType: string; maxCapacity: string
}

const emptyForm = (locationId = ''): FormData => ({
  locationId, name: '', sessionType: 'NINJA_CLASS', creditType: 'CLASS',
  dayOfWeek: '1', startTime: '15:30', endTime: '16:30',
  includeLunch: false, periodType: 'REGULAR', maxCapacity: '',
})

export default function ScheduleSettingsClient({
  initialSessions, locations, initialOverrides,
}: {
  initialSessions: Session[]
  locations: Location[]
  initialOverrides: CalendarOverride[]
}) {
  const [tab, setTab] = useState<'sessions' | 'calendar'>('sessions')
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; session?: Session } | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm(locations[0]?.id.toString()))
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [filterLoc, setFilterLoc] = useState<number | 'all'>('all')

  // Calendar overrides state
  const [overrides, setOverrides] = useState<CalendarOverride[]>(initialOverrides)
  const [calYear, setCalYear]   = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [ovPeriod, setOvPeriod] = useState('VACATION')
  const [ovNote, setOvNote]     = useState('')
  const [ovSaving, setOvSaving] = useState(false)

  function toISO(d: Date | string) {
    const date = d instanceof Date ? d : new Date(d)
    return date.toISOString().split('T')[0]
  }
  function overrideForDate(dateStr: string) {
    return overrides.find(o => toISO(o.date) === dateStr)
  }

  async function saveOverride() {
    if (!selectedDate) return
    setOvSaving(true)
    const res = await fetch('/api/admin/calendar-overrides', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate, periodType: ovPeriod, note: ovNote || null }),
    })
    if (res.ok) {
      const { override } = await res.json()
      setOverrides(prev => {
        const without = prev.filter(o => toISO(o.date) !== selectedDate)
        return [...without, override].sort((a, b) => toISO(a.date).localeCompare(toISO(b.date)))
      })
    }
    setOvSaving(false)
    setSelectedDate(null)
  }

  async function removeOverride(id: number) {
    const res = await fetch(`/api/admin/calendar-overrides/${id}`, { method: 'DELETE' })
    if (res.ok) setOverrides(prev => prev.filter(o => o.id !== id))
    setSelectedDate(null)
  }

  function openAdd() {
    setForm(emptyForm(locations[0]?.id.toString()))
    setModal({ mode: 'add' })
  }

  function openEdit(s: Session) {
    setForm({
      locationId: s.location.id.toString(),
      name: s.name,
      sessionType: s.sessionType,
      creditType: s.creditType,
      dayOfWeek: s.dayOfWeek?.toString() ?? '1',
      startTime: s.startTime,
      endTime: s.endTime,
      includeLunch: s.includeLunch,
      periodType: s.periodType,
      maxCapacity: s.maxCapacity?.toString() ?? '',
    })
    setModal({ mode: 'edit', session: s })
  }

  async function saveSession() {
    setSaving(true)
    try {
      const body = {
        ...form,
        dayOfWeek: form.dayOfWeek !== '' ? parseInt(form.dayOfWeek) : null,
        maxCapacity: form.maxCapacity ? parseInt(form.maxCapacity) : null,
        locationId: parseInt(form.locationId),
      }

      if (modal?.mode === 'add') {
        const res = await fetch('/api/admin/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (res.ok) setSessions(prev => [...prev, data.session].sort((a, b) =>
          a.location.id - b.location.id || (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0) || a.startTime.localeCompare(b.startTime)
        ))
      } else if (modal?.session) {
        const res = await fetch(`/api/admin/sessions/${modal.session.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (res.ok) setSessions(prev => prev.map(s => s.id === data.session.id ? data.session : s))
      }

      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  async function deleteSession(id: number) {
    const res = await fetch(`/api/admin/sessions/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      if (data.deleted) {
        setSessions(prev => prev.filter(s => s.id !== id))
      } else if (data.deactivated) {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, active: false } : s))
      }
    }
    setDeleteId(null)
  }

  async function toggleActive(s: Session) {
    const res = await fetch(`/api/admin/sessions/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !s.active }),
    })
    const data = await res.json()
    if (res.ok) setSessions(prev => prev.map(x => x.id === data.session.id ? data.session : x))
  }

  const filtered = filterLoc === 'all' ? sessions : sessions.filter(s => s.location.id === filterLoc)

  // Group by location then day
  const grouped = filtered.reduce<Record<string, Session[]>>((acc, s) => {
    const key = `${s.location.id}__${s.location.name}`
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <div className="p-4 sm:p-8 max-w-3xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/schedule"
            className="flex items-center gap-1 text-sm font-semibold"
            style={{ color: '#94A3B8' }}>
            <ChevronLeft size={16} /> Planning
          </Link>
          <div>
            <h1 className="font-display font-semibold text-xl" style={{ color: '#0A1628' }}>
              {tab === 'sessions' ? 'Sessions' : 'Calendar'}
            </h1>
            <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
              {tab === 'sessions' ? `${sessions.length} configured` : `${overrides.length} overridden days`}
            </p>
          </div>
        </div>
        {tab === 'sessions' && (
          <button onClick={openAdd} className="btn btn-primary flex items-center gap-1.5">
            <Plus size={15} /> Add
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#F1F5F9' }}>
        {([['sessions', 'Sessions'], ['calendar', 'Calendar']] as const).map(([v, label]) => (
          <button key={v} onClick={() => setTab(v)}
            className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
            style={tab === v ? { background: '#fff', color: '#0A1628', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: '#94A3B8' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── CALENDAR TAB ── */}
      {tab === 'calendar' && (() => {
        const firstDay   = new Date(calYear, calMonth, 1)
        const lastDay    = new Date(calYear, calMonth + 1, 0)
        const startDow   = firstDay.getDay()
        const offset     = startDow === 0 ? 6 : startDow - 1
        const totalCells = Math.ceil((offset + lastDay.getDate()) / 7) * 7
        const todayStr   = new Date().toISOString().split('T')[0]
        const ov = selectedDate ? overrideForDate(selectedDate) : null

        return (
          <div className="space-y-4">
            {/* Month nav */}
            <div className="card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}
                  className="p-1.5 rounded-lg hover:bg-slate-100">
                  <ChevronLeft size={16} style={{ color: '#64748B' }} />
                </button>
                <p className="font-display font-semibold text-sm" style={{ color: '#0A1628' }}>
                  {MONTHS[calMonth]} {calYear}
                </p>
                <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}
                  className="p-1.5 rounded-lg hover:bg-slate-100">
                  <ChevronRight size={16} style={{ color: '#64748B' }} />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1">
                {DAYS_SHORT.map(d => (
                  <p key={d} className="text-center text-xs font-bold uppercase py-0.5" style={{ color: '#94A3B8' }}>{d}</p>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: totalCells }, (_, i) => {
                  const dayNum = i - offset + 1
                  if (dayNum < 1 || dayNum > lastDay.getDate()) return <div key={`e-${i}`} />
                  const dateStr   = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`
                  const dayOv     = overrideForDate(dateStr)
                  const isToday   = dateStr === todayStr
                  const isSel     = dateStr === selectedDate
                  const ovDef     = PERIOD_OVERRIDE_TYPES.find(p => p.value === dayOv?.periodType)
                  return (
                    <button key={dateStr}
                      onClick={() => {
                        setSelectedDate(dateStr === selectedDate ? null : dateStr)
                        if (dayOv) { setOvPeriod(dayOv.periodType); setOvNote(dayOv.note ?? '') }
                        else { setOvPeriod('VACATION'); setOvNote('') }
                      }}
                      className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-xs font-black"
                      style={
                        isSel    ? { background: '#0A1628', color: '#CCFF00' } :
                        dayOv    ? { background: ovDef?.bg, color: ovDef?.color, border: `1px solid ${ovDef?.color}40` } :
                        isToday  ? { background: '#F0FDF4', color: '#16A34A', border: '1px solid #86EFAC' } :
                        { background: '#F8FAFC', color: '#0A1628', border: '1px solid #E2E8F0' }
                      }>
                      {dayNum}
                      {dayOv && !isSel && (
                        <span style={{ fontSize: '0.45rem', fontWeight: 900, lineHeight: 1 }}>
                          {ovDef?.label}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected date panel */}
            {selectedDate && (
              <div className="card p-4 space-y-4">
                <p className="font-semibold text-sm" style={{ color: '#0A1628' }}>
                  {new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>

                {ov ? (
                  /* Existing override */
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold" style={{ color: '#64748B' }}>Current type</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ background: PERIOD_OVERRIDE_TYPES.find(p => p.value === ov.periodType)?.bg, color: PERIOD_OVERRIDE_TYPES.find(p => p.value === ov.periodType)?.color }}>
                          {PERIOD_OVERRIDE_TYPES.find(p => p.value === ov.periodType)?.label}
                        </span>
                        {ov.note && <span className="text-xs" style={{ color: '#94A3B8' }}>{ov.note}</span>}
                      </div>
                    </div>
                    <button onClick={() => removeOverride(ov.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={{ background: '#FEF2F2', color: '#EF4444' }}>
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                ) : (
                  /* Set new override */
                  <div className="space-y-3">
                    <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                      Mark this day as:
                    </p>
                    <div className="flex gap-2">
                      {PERIOD_OVERRIDE_TYPES.map(p => (
                        <button key={p.value} type="button"
                          onClick={() => setOvPeriod(p.value)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all"
                          style={ovPeriod === p.value
                            ? { background: p.color, color: '#fff', borderColor: p.color }
                            : { background: '#fff', color: '#64748B', borderColor: '#E2E8F0' }}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <input placeholder="Note (optional)" value={ovNote} onChange={e => setOvNote(e.target.value)}
                      className="input w-full text-sm" />
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedDate(null)} className="btn btn-secondary flex-1 text-sm">Cancel</button>
                      <button onClick={saveOverride} disabled={ovSaving}
                        className="btn flex-1 text-sm font-bold"
                        style={{ background: '#0A1628', color: '#CCFF00', opacity: ovSaving ? 0.5 : 1 }}>
                        {ovSaving ? '…' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* List of all overrides */}
            {overrides.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
                  Overridden days ({overrides.length})
                </p>
                {overrides.map(o => {
                  const p = PERIOD_OVERRIDE_TYPES.find(pt => pt.value === o.periodType)
                  return (
                    <div key={o.id} className="card px-4 py-3 flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
                        style={{ background: p?.bg, color: p?.color }}>
                        {p?.label}
                      </span>
                      <p className="text-sm font-semibold flex-1" style={{ color: '#0A1628' }}>
                        {new Date(o.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        {o.note && <span className="ml-2 text-xs font-normal" style={{ color: '#94A3B8' }}>{o.note}</span>}
                      </p>
                      <button onClick={() => removeOverride(o.id)} className="p-1.5" style={{ color: '#CBD5E1' }}>
                        <X size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {tab === 'sessions' && <>

      {/* Location filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterLoc('all')}
          className="tag"
          style={filterLoc === 'all' ? { background: '#0A1628', color: '#CCFF00' } : {}}>
          All
        </button>
        {locations.map(l => (
          <button key={l.id} onClick={() => setFilterLoc(l.id)}
            className="tag"
            style={filterLoc === l.id ? { background: '#0A1628', color: '#CCFF00' } : {}}>
            {l.name}
          </button>
        ))}
      </div>

      {/* Sessions grouped by location */}
      {Object.entries(grouped).map(([key, slist]) => {
        const [, locName] = key.split('__')
        // Sub-group by day
        const byDay = slist.reduce<Record<number, Session[]>>((acc, s) => {
          const dow = s.dayOfWeek ?? -1
          if (!acc[dow]) acc[dow] = []
          acc[dow].push(s)
          return acc
        }, {})

        return (
          <div key={key} className="space-y-3">
            <h2 className="font-display font-semibold text-sm uppercase tracking-wide"
              style={{ color: '#64748B' }}>{locName}</h2>

            {Object.entries(byDay)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([dow, daySessions]) => (
                <div key={dow} className="card divide-y" style={{ borderColor: '#E2E8F0' }}>
                  <div className="px-4 py-2 flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider"
                      style={{ color: '#94A3B8' }}>
                      {parseInt(dow) >= 0 ? DAYS[parseInt(dow)] : 'No day'}
                    </span>
                  </div>
                  {daySessions.map(s => {
                    const color = CREDIT_COLORS[s.creditType] ?? '#94A3B8'
                    return (
                      <div key={s.id}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ opacity: s.active ? 1 : 0.45 }}>
                        <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm" style={{ color: '#0A1628' }}>{s.name}</p>
                            <span className="badge" style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}>
                              {s.creditType.replace('_', ' ')}
                            </span>
                            {!s.active && <span className="badge" style={{ background: '#FEF2F2', color: '#DC2626' }}>Inactive</span>}
                            {s.periodType !== 'REGULAR' && (
                              <span className="badge" style={{ background: '#FFF7ED', color: '#EA580C' }}>
                                {PERIOD_TYPES.find(p => p.value === s.periodType)?.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                            {s.startTime} – {s.endTime}
                            {s.maxCapacity ? ` · max ${s.maxCapacity}` : ''}
                            {s.includeLunch ? ' · 🍱 Lunch' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => toggleActive(s)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
                            title={s.active ? 'Deactivate' : 'Activate'}
                            style={{ color: s.active ? '#22C55E' : '#CBD5E1' }}>
                            <Power size={14} />
                          </button>
                          <button onClick={() => openEdit(s)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
                            style={{ color: '#64748B' }}>
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteId(s.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-red-50"
                            style={{ color: '#CBD5E1' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
          </div>
        )
      })}

      {filtered.length === 0 && (
        <div className="card p-10 text-center">
          <p className="font-semibold" style={{ color: '#94A3B8' }}>No sessions</p>
          <button onClick={openAdd} className="btn btn-primary mt-4 inline-flex gap-1.5">
            <Plus size={14} /> Create the first one
          </button>
        </div>
      )}

      </> /* end tab === 'sessions' */}

      {/* ── Add / Edit Modal ─────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,22,40,0.50)', backdropFilter: 'blur(4px)' }}
          onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#E2E8F0' }}>
              <h3 className="font-display font-semibold text-lg" style={{ color: '#0A1628' }}>
                {modal.mode === 'add' ? 'New session' : 'Edit session'}
              </h3>
              <button onClick={() => setModal(null)} style={{ color: '#94A3B8' }}>
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Location *</label>
                <select value={form.locationId} onChange={e => setForm(f => ({ ...f, locationId: e.target.value }))} className="input w-full">
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ninja Class Juniors" required className="input w-full" />
              </div>

              {/* Session type + Credit type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Type</label>
                  <select value={form.sessionType} onChange={e => setForm(f => ({ ...f, sessionType: e.target.value }))} className="input w-full">
                    {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Credit</label>
                  <select value={form.creditType} onChange={e => setForm(f => ({ ...f, creditType: e.target.value }))} className="input w-full">
                    {CREDIT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Day of week */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Day of week</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS_SHORT.map((day, i) => (
                    <button key={i} type="button"
                      onClick={() => setForm(f => ({ ...f, dayOfWeek: i.toString() }))}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      style={form.dayOfWeek === i.toString()
                        ? { background: '#0A1628', color: '#CCFF00' }
                        : { background: '#F1F5F9', color: '#64748B' }}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Start *</label>
                  <input type="time" value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="input w-full" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>End *</label>
                  <input type="time" value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="input w-full" />
                </div>
              </div>

              {/* Period type + Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Period</label>
                  <select value={form.periodType} onChange={e => setForm(f => ({ ...f, periodType: e.target.value }))} className="input w-full">
                    {PERIOD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Max capacity</label>
                  <input type="number" min={1} max={100} value={form.maxCapacity}
                    onChange={e => setForm(f => ({ ...f, maxCapacity: e.target.value }))}
                    placeholder="—" className="input w-full" />
                </div>
              </div>

              {/* Lunch */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.includeLunch}
                  onChange={e => setForm(f => ({ ...f, includeLunch: e.target.checked }))}
                  className="w-4 h-4 rounded" style={{ accentColor: '#0A1628' }} />
                <span className="text-sm font-semibold" style={{ color: '#0A1628' }}>Include lunch</span>
              </label>

            </div>

            {/* Modal footer */}
            <div className="flex gap-3 p-5 border-t" style={{ borderColor: '#E2E8F0' }}>
              <button onClick={saveSession} disabled={saving || !form.name || !form.startTime || !form.endTime}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? '…' : <><Check size={15} /> Save</>}
              </button>
              <button onClick={() => setModal(null)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ──────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,22,40,0.50)' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
            <p className="font-display font-semibold text-lg" style={{ color: '#0A1628' }}>Delete this session?</p>
            <p className="text-sm font-semibold" style={{ color: '#64748B' }}>
              If reservations exist, the session will be deactivated instead of deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => deleteSession(deleteId)}
                className="btn flex-1 font-bold"
                style={{ background: '#DC2626', color: '#fff' }}>
                Delete
              </button>
              <button onClick={() => setDeleteId(null)} className="btn btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
