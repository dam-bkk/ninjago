'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Calendar, X, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

type NinjaEvent = {
  id: number
  locationId: number
  name: string
  sessionType: string
  creditType: string | null
  date: Date | string
  startTime: string
  endTime: string
  maxCapacity: number | null
  description: string | null
  active: boolean
  location: { id: number; name: string }
}
type Location = { id: number; name: string }

const SESSION_TYPES = [
  { value: 'NINJA_CLASS',   label: 'Ninja Class' },
  { value: 'BJJ_COMBO',     label: 'BJJ Combo' },
  { value: 'CAMP_REGULAR',  label: 'Camp Regular' },
  { value: 'CAMP_EXTENDED', label: 'Camp Extended' },
]
const CREDIT_TYPES = [
  { value: '',             label: 'No credit' },
  { value: 'CLASS',        label: 'Class' },
  { value: 'CAMP',         label: 'Camp' },
  { value: 'CAMP_EXTENDED',label: 'Camp Extended' },
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function formatDate(d: Date | string) {
  const date = new Date(d)
  return `${DAYS_SHORT[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}
function toDateInput(d: Date | string) {
  const date = new Date(d)
  return date.toISOString().split('T')[0]
}
function isFuture(d: Date | string) {
  return new Date(d) >= new Date(new Date().toDateString())
}

const LOCATION_COLORS = ['#C2410C', '#3730A3', '#065F46', '#9F1239']
function locColor(locationId: number, locations: Location[]) {
  const idx = locations.findIndex(l => l.id === locationId)
  return LOCATION_COLORS[idx >= 0 ? idx % LOCATION_COLORS.length : 0]
}

const EMPTY_FORM = {
  name: '', sessionType: 'NINJA_CLASS', creditType: '', locationId: '',
  date: '', startTime: '09:00', endTime: '11:00',
  maxCapacity: '', description: '',
}

export default function EventsClient({
  initialEvents, locations,
}: {
  initialEvents: NinjaEvent[]
  locations: Location[]
}) {
  const [events, setEvents] = useState<NinjaEvent[]>(initialEvents)
  const [modal, setModal]   = useState<false | 'add' | NinjaEvent>(false)
  const [form, setForm]     = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<NinjaEvent | null>(null)
  const [tab, setTab]       = useState<'upcoming' | 'past'>('upcoming')

  function openAdd() {
    setForm({ ...EMPTY_FORM, locationId: locations[0]?.id.toString() ?? '' })
    setModal('add')
  }
  function openEdit(e: NinjaEvent) {
    setForm({
      name: e.name, sessionType: e.sessionType, creditType: e.creditType ?? '',
      locationId: e.locationId.toString(), date: toDateInput(e.date),
      startTime: e.startTime, endTime: e.endTime,
      maxCapacity: e.maxCapacity?.toString() ?? '', description: e.description ?? '',
    })
    setModal(e)
  }
  function closeModal() { setModal(false) }

  async function save() {
    setSaving(true)
    const body = {
      name: form.name, sessionType: form.sessionType, creditType: form.creditType || null,
      locationId: form.locationId, date: form.date,
      startTime: form.startTime, endTime: form.endTime,
      maxCapacity: form.maxCapacity || null, description: form.description || null,
    }
    if (modal === 'add') {
      const res = await fetch('/api/admin/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        const { event } = await res.json()
        setEvents(prev => [...prev, event].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.startTime.localeCompare(b.startTime)))
      }
    } else if (modal && typeof modal !== 'string') {
      const res = await fetch(`/api/admin/events/${modal.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        const { event } = await res.json()
        setEvents(prev => prev.map(e => e.id === event.id ? event : e))
      }
    }
    setSaving(false)
    closeModal()
  }

  async function deleteEvent(e: NinjaEvent) {
    const res = await fetch(`/api/admin/events/${e.id}`, { method: 'DELETE' })
    if (res.ok) setEvents(prev => prev.filter(ev => ev.id !== e.id))
    setDeleteTarget(null)
  }

  const upcoming = events.filter(e => isFuture(e.date))
  const past     = events.filter(e => !isFuture(e.date))
  const displayed = tab === 'upcoming' ? upcoming : past

  const isEditing = modal !== false && typeof modal !== 'string'
  const formValid = form.name && form.locationId && form.date && form.startTime && form.endTime

  return (
    <div className="p-4 sm:p-8 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/schedule" className="text-slate-400 hover:text-slate-600">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>Events</h1>
            <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>One-time sessions</p>
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          style={{ background: '#0A1628', color: '#CCFF00' }}>
          <Plus size={15} /> New event
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#F1F5F9' }}>
        {(['upcoming', 'past'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
            style={tab === t ? { background: '#fff', color: '#0A1628', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: '#94A3B8' }}>
            {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <div className="card p-10 text-center">
          <Calendar size={32} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} />
          <p className="font-semibold" style={{ color: '#94A3B8' }}>
            {tab === 'upcoming' ? 'No upcoming events' : 'No past events'}
          </p>
          {tab === 'upcoming' && (
            <button onClick={openAdd} className="mt-4 text-sm font-bold" style={{ color: '#0A1628' }}>
              + Create event
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(e => {
            const col = locColor(e.locationId, locations)
            return (
              <div key={e.id} className="card overflow-hidden">
                <div className="flex items-stretch">
                  {/* Color bar */}
                  <div className="w-1 shrink-0 rounded-l-2xl" style={{ background: col }} />
                  <div className="flex-1 flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-display font-semibold text-base leading-tight" style={{ color: '#0A1628' }}>{e.name}</p>
                        {!e.active && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF2F2', color: '#EF4444' }}>Inactive</span>
                        )}
                      </div>
                      <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                        {formatDate(e.date)} · {e.startTime}–{e.endTime} · {e.location.name}
                      </p>
                      {e.description && (
                        <p className="text-xs mt-1" style={{ color: '#64748B' }}>{e.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${col}18`, color: col }}>
                          {SESSION_TYPES.find(t => t.value === e.sessionType)?.label ?? e.sessionType}
                        </span>
                        {e.creditType && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: '#F0FDF4', color: '#16A34A' }}>
                            {CREDIT_TYPES.find(t => t.value === e.creditType)?.label}
                          </span>
                        )}
                        {e.maxCapacity && (
                          <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                            max {e.maxCapacity}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openEdit(e)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: '#94A3B8' }}
                        title="Edit">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(e)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: '#EF4444' }}
                        title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal !== false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={closeModal}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#E2E8F0' }}>
              <h2 className="font-display font-semibold text-lg" style={{ color: '#0A1628' }}>
                {isEditing ? 'Edit event' : 'New event'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#64748B' }}>Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input w-full" placeholder="e.g. Special Songkran Camp" />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#64748B' }}>Location *</label>
                <select value={form.locationId} onChange={e => setForm(f => ({ ...f, locationId: e.target.value }))}
                  className="input w-full">
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#64748B' }}>Date *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="input w-full" />
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#64748B' }}>Start *</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#64748B' }}>End *</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="input w-full" />
                </div>
              </div>

              {/* Session type */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#64748B' }}>Session type</label>
                <div className="flex flex-wrap gap-2">
                  {SESSION_TYPES.map(t => (
                    <button key={t.value} type="button"
                      onClick={() => setForm(f => ({ ...f, sessionType: t.value }))}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
                      style={form.sessionType === t.value
                        ? { background: '#0A1628', color: '#CCFF00', borderColor: '#0A1628' }
                        : { background: '#fff', color: '#64748B', borderColor: '#E2E8F0' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Credit type */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#64748B' }}>Credit type</label>
                <select value={form.creditType} onChange={e => setForm(f => ({ ...f, creditType: e.target.value }))}
                  className="input w-full">
                  {CREDIT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Max capacity */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#64748B' }}>Max capacity</label>
                <input type="number" min="1" value={form.maxCapacity} onChange={e => setForm(f => ({ ...f, maxCapacity: e.target.value }))}
                  className="input w-full" placeholder="Unlimited" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#64748B' }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="input w-full" rows={2} placeholder="Optional description…" />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t" style={{ borderColor: '#E2E8F0' }}>
              <button onClick={closeModal} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={save} disabled={!formValid || saving}
                className="btn flex-1 font-bold"
                style={{ background: '#0A1628', color: '#CCFF00', opacity: (!formValid || saving) ? 0.5 : 1 }}>
                {saving ? 'Saving…' : isEditing ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center"
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#FEF2F2' }}>
              <Trash2 size={20} style={{ color: '#EF4444' }} />
            </div>
            <h3 className="font-display font-semibold text-lg mb-1" style={{ color: '#0A1628' }}>Delete event</h3>
            <p className="text-sm mb-4" style={{ color: '#64748B' }}>
              <strong>{deleteTarget.name}</strong> ({formatDate(deleteTarget.date)}) will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={() => deleteEvent(deleteTarget)}
                className="btn flex-1 font-bold"
                style={{ background: '#EF4444', color: '#fff' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
