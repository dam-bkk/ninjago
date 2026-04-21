'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight, X, Calendar, Check } from 'lucide-react'
import Link from 'next/link'

type Slot = {
  id: number
  locationId: number | null
  date: Date | string
  startTime: string
  endTime: string
  maxParties: number
  booked: boolean
  location: { id: number; name: string } | null
}
type Location = { id: number; name: string }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function toISO(d: Date | string) {
  const date = d instanceof Date ? d : new Date(d)
  return date.toISOString().split('T')[0]
}

const LOCATION_COLORS = ['#C2410C', '#3730A3', '#065F46', '#9F1239']
function locColor(locationId: number | null, locations: Location[]) {
  if (!locationId) return '#64748B'
  const idx = locations.findIndex(l => l.id === locationId)
  return LOCATION_COLORS[idx >= 0 ? idx % LOCATION_COLORS.length : 0]
}

const EMPTY_FORM = { locationId: '', startTime: '10:00', endTime: '14:00', maxParties: '1' }

export default function BirthdaySlotsClient({
  initialSlots, locations,
}: {
  initialSlots: Slot[]
  locations: Location[]
}) {
  const [slots, setSlots]     = useState<Slot[]>(initialSlots)
  const [year, setYear]       = useState(new Date().getFullYear())
  const [month, setMonth]     = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState({ ...EMPTY_FORM })
  const [saving, setSaving]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Slot | null>(null)

  // Calendar grid
  const firstDay   = new Date(year, month, 1)
  const lastDay    = new Date(year, month + 1, 0)
  const startDow   = firstDay.getDay()
  const offset     = startDow === 0 ? 6 : startDow - 1
  const totalCells = Math.ceil((offset + lastDay.getDate()) / 7) * 7
  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const d = i - offset + 1
    return d >= 1 && d <= lastDay.getDate() ? d : null
  })

  function slotsForDate(dateStr: string) {
    return slots.filter(s => toISO(s.date) === dateStr)
  }
  function hasSlot(dateStr: string) { return slotsForDate(dateStr).length > 0 }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  function openAdd(dateStr: string) {
    setSelectedDate(dateStr)
    setForm({ ...EMPTY_FORM, locationId: locations[0]?.id.toString() ?? '' })
    setModal(true)
  }
  function closeModal() { setModal(false) }

  async function save() {
    if (!selectedDate) return
    setSaving(true)
    const body = {
      locationId: form.locationId || null,
      date: selectedDate,
      startTime: form.startTime,
      endTime: form.endTime,
      maxParties: form.maxParties,
    }
    const res = await fetch('/api/admin/birthday-slots', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) {
      const { slot } = await res.json()
      setSlots(prev => [...prev, slot].sort((a, b) => toISO(a.date).localeCompare(toISO(b.date)) || a.startTime.localeCompare(b.startTime)))
    }
    setSaving(false)
    closeModal()
  }

  async function toggleBooked(slot: Slot) {
    const res = await fetch(`/api/admin/birthday-slots/${slot.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booked: !slot.booked }),
    })
    if (res.ok) {
      const { slot: updated } = await res.json()
      setSlots(prev => prev.map(s => s.id === updated.id ? updated : s))
    }
  }

  async function deleteSlot(s: Slot) {
    const res = await fetch(`/api/admin/birthday-slots/${s.id}`, { method: 'DELETE' })
    if (res.ok) setSlots(prev => prev.filter(sl => sl.id !== s.id))
    setDeleteTarget(null)
    setSelectedDate(null)
  }

  const today = toISO(new Date())
  const selectedSlots = selectedDate ? slotsForDate(selectedDate) : []

  return (
    <div className="p-4 sm:p-8 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/birthday" className="text-slate-400 hover:text-slate-600">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>Birthday slots</h1>
          <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>Available dates for parties</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Calendar */}
        <div className="card p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronLeft size={18} style={{ color: '#64748B' }} />
            </button>
            <p className="font-display font-semibold text-base" style={{ color: '#0A1628' }}>
              {MONTHS[month]} {year}
            </p>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronRight size={18} style={{ color: '#64748B' }} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map(d => (
              <p key={d} className="text-center text-xs font-bold uppercase tracking-wide py-1" style={{ color: '#94A3B8' }}>{d}</p>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((dayNum, i) => {
              if (!dayNum) return <div key={`e-${i}`} />
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
              const isToday    = dateStr === today
              const isSelected = dateStr === selectedDate
              const daySlots   = slotsForDate(dateStr)
              const hasBooked  = daySlots.some(s => s.booked)
              const hasFree    = daySlots.some(s => !s.booked)
              const isPast     = dateStr < today

              return (
                <button key={dateStr}
                  onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                  className="relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all"
                  style={{
                    background: isSelected ? '#0A1628' : isToday ? '#F0FDF4' : '#F8FAFC',
                    border: isSelected ? 'none' : isToday ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                    opacity: isPast && !daySlots.length ? 0.4 : 1,
                  }}>
                  <span className="text-sm font-black leading-none"
                    style={{ color: isSelected ? '#CCFF00' : isToday ? '#16A34A' : '#0A1628' }}>
                    {dayNum}
                  </span>
                  {daySlots.length > 0 && (
                    <div className="flex gap-0.5">
                      {hasFree   && <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? '#CCFF00' : '#22C55E' }} />}
                      {hasBooked && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F59E0B' }} />}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }} />
              <span className="text-xs font-semibold" style={{ color: '#64748B' }}>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
              <span className="text-xs font-semibold" style={{ color: '#64748B' }}>Booked</span>
            </div>
          </div>
        </div>

        {/* Slots panel */}
        <div className="space-y-3">
          {selectedDate ? (
            <>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm" style={{ color: '#0A1628' }}>
                  {new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <button onClick={() => openAdd(selectedDate)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: '#0A1628', color: '#CCFF00' }}>
                  <Plus size={13} /> Add
                </button>
              </div>

              {selectedSlots.length === 0 ? (
                <div className="card p-6 text-center">
                  <Calendar size={24} className="mx-auto mb-2" style={{ color: '#CBD5E1' }} />
                  <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>No slots</p>
                  <button onClick={() => openAdd(selectedDate)} className="mt-3 text-xs font-bold" style={{ color: '#0A1628' }}>
                    + Add a slot
                  </button>
                </div>
              ) : (
                selectedSlots.map(s => {
                  const col = locColor(s.locationId, locations)
                  return (
                    <div key={s.id} className="card p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm" style={{ color: '#0A1628' }}>
                          {s.startTime} – {s.endTime}
                        </p>
                        <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                          {s.location?.name ?? 'All locations'} · max {s.maxParties} part{s.maxParties > 1 ? 'ies' : 'y'}
                        </p>
                      </div>
                      <button onClick={() => toggleBooked(s)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ background: s.booked ? '#FEF3C7' : '#F0FDF4', color: s.booked ? '#D97706' : '#16A34A' }}
                        title={s.booked ? 'Mark available' : 'Mark booked'}>
                        <Check size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(s)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: '#EF4444' }}
                        title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })
              )}
            </>
          ) : (
            <div className="card p-8 text-center">
              <Calendar size={32} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} />
              <p className="font-semibold text-sm" style={{ color: '#94A3B8' }}>
                Select a date to manage slots
              </p>
            </div>
          )}

          {/* Upcoming list */}
          {slots.filter(s => toISO(s.date) >= today).length > 0 && !selectedDate && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>Upcoming</p>
              {slots.filter(s => toISO(s.date) >= today).slice(0, 8).map(s => {
                const col = locColor(s.locationId, locations)
                const d = new Date(s.date)
                return (
                  <button key={s.id} onClick={() => {
                    setYear(d.getFullYear()); setMonth(d.getMonth()); setSelectedDate(toISO(s.date))
                  }}
                    className="card w-full text-left px-4 py-3 flex items-center gap-3">
                    <div className="text-center w-10 shrink-0">
                      <p className="text-xs font-bold" style={{ color: '#94A3B8' }}>{MONTHS_SHORT[d.getMonth()]}</p>
                      <p className="text-lg font-black leading-none" style={{ color: '#0A1628' }}>{d.getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: '#0A1628' }}>{s.startTime}–{s.endTime}</p>
                      <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>{s.location?.name ?? 'All locations'}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: s.booked ? '#FEF3C7' : '#F0FDF4', color: s.booked ? '#D97706' : '#16A34A' }}>
                      {s.booked ? 'Booked' : 'Free'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add modal */}
      {modal && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={closeModal}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#E2E8F0' }}>
              <div>
                <h2 className="font-display font-semibold text-lg" style={{ color: '#0A1628' }}>New slot</h2>
                <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                  {new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#64748B' }}>Location</label>
                <select value={form.locationId} onChange={e => setForm(f => ({ ...f, locationId: e.target.value }))}
                  className="input w-full">
                  <option value="">All locations</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#64748B' }}>Start</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#64748B' }}>End</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="input w-full" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#64748B' }}>Max simultaneous parties</label>
                <input type="number" min="1" max="5" value={form.maxParties}
                  onChange={e => setForm(f => ({ ...f, maxParties: e.target.value }))}
                  className="input w-full" />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t" style={{ borderColor: '#E2E8F0' }}>
              <button onClick={closeModal} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={save} disabled={saving}
                className="btn flex-1 font-bold"
                style={{ background: '#0A1628', color: '#CCFF00', opacity: saving ? 0.5 : 1 }}>
                {saving ? 'Saving…' : 'Create'}
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
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FEF2F2' }}>
              <Trash2 size={20} style={{ color: '#EF4444' }} />
            </div>
            <h3 className="font-display font-semibold text-lg mb-1" style={{ color: '#0A1628' }}>Delete slot</h3>
            <p className="text-sm mb-4" style={{ color: '#64748B' }}>
              {new Date(deleteTarget.date).toLocaleDateString('en-GB')} · {deleteTarget.startTime}–{deleteTarget.endTime}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={() => deleteSlot(deleteTarget)}
                className="btn flex-1 font-bold" style={{ background: '#EF4444', color: '#fff' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
