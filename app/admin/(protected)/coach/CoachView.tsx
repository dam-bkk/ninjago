'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, Clock, UserPlus, ChevronLeft, ChevronRight, Utensils, CreditCard, PackagePlus } from 'lucide-react'

type Location = { id: number; name: string }
type Student = { id: number; name: string; age: number | null }

type PackagePrice = {
  id: number; label: string; packageType: string
  price: number; credits: number; validityMonths: number
}

type SessionData = {
  id: number
  name: string
  startTime: string
  endTime: string
  creditType: string
  location: { name: string }
  reservations: ReservationData[]
}

type ReservationData = {
  id: number
  status: string
  student: {
    id: number
    name: string
    age: number
    packages: { package: { creditType: string; totalCredits: number; usedCredits: number } }[]
  }
  attendance: { id: number; lunch: boolean } | null
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function offsetDate(base: string, days: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function creditsLeft(student: ReservationData['student'], creditType: string) {
  return student.packages
    .filter(sp => sp.package.creditType === creditType)
    .reduce((acc, sp) => acc + sp.package.totalCredits - sp.package.usedCredits, 0)
}

export default function CoachView({
  locations, students, staffId,
}: {
  locations: Location[]
  students: Student[]
  staffId: number
}) {
  const [date, setDate] = useState(todayStr())
  const [locationId, setLocationId] = useState(locations[0]?.id ?? 0)
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedSession, setExpandedSession] = useState<number | null>(null)
  const [checkingIn, setCheckingIn] = useState<number | null>(null)

  // Add student to session modal
  const [addModal, setAddModal] = useState<{ sessionId: number; creditType: string } | null>(null)
  const [addStudentId, setAddStudentId] = useState('')
  const [addDropIn, setAddDropIn] = useState(false)
  const [addDropInAmount, setAddDropInAmount] = useState('')
  const [addLunch, setAddLunch] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  // Add package modal
  const [packModal, setPackModal] = useState<{ studentId: number; studentName: string } | null>(null)
  const [packPrices, setPackPrices] = useState<PackagePrice[]>([])
  const [packSelected, setPackSelected] = useState<PackagePrice | null>(null)
  const [packPricePaid, setPackPricePaid] = useState('')
  const [packMethod, setPackMethod] = useState('CASH')
  const [packNote, setPackNote] = useState('')
  const [packLoading, setPackLoading] = useState(false)
  const [packError, setPackError] = useState('')

  async function openPackModal(studentId: number, studentName: string) {
    setPackModal({ studentId, studentName })
    setPackSelected(null)
    setPackPricePaid('')
    setPackMethod('CASH')
    setPackNote('')
    setPackError('')
    if (!packPrices.length) {
      const res = await fetch('/api/admin/package-prices')
      const data = await res.json()
      setPackPrices(data.prices ?? [])
    }
  }

  async function handleAddPack(e: React.FormEvent) {
    e.preventDefault()
    if (!packModal || !packSelected) { setPackError('Select a package'); return }
    setPackLoading(true)
    setPackError('')
    try {
      const res = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: packModal.studentId,
          packagePriceId: packSelected.id,
          pricePaid: parseInt(packPricePaid),
          method: packMethod,
          notes: packNote || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setPackError(data.error ?? 'Error'); return }
      setPackModal(null)
      fetchSessions()
    } catch {
      setPackError('Network error')
    } finally {
      setPackLoading(false)
    }
  }

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/sessions/today?locationId=${locationId}&date=${date}`)
      const data = await res.json()
      setSessions(data.sessions ?? [])
      if (data.sessions?.length > 0 && expandedSession === null) {
        setExpandedSession(data.sessions[0].id)
      }
    } finally {
      setLoading(false)
    }
  }, [date, locationId])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  async function checkIn(student: ReservationData['student'], sessionId: number, creditType: string) {
    setCheckingIn(student.id)
    try {
      await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id, sessionId, locationId, date, isDropIn: false, lunch: false,
        }),
      })
      fetchSessions()
    } finally {
      setCheckingIn(null)
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault()
    if (!addModal || !addStudentId) { setAddError('Select a student'); return }
    setAddError('')
    setAddLoading(true)
    try {
      const res = await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: parseInt(addStudentId),
          sessionId: addModal.sessionId,
          locationId, date,
          isDropIn: addDropIn,
          dropInAmount: addDropIn ? parseInt(addDropInAmount) : undefined,
          dropInMethod: 'CASH',
          lunch: addLunch,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setAddError(data.error ?? 'Error'); return }
      setAddModal(null)
      fetchSessions()
    } finally {
      setAddLoading(false)
    }
  }

  const creditColor = (t: string) =>
    t === 'CLASS' ? '#00C2E0' : t === 'CAMP' ? '#CCFF00' : '#FFB400'

  return (
    <div className="p-4 sm:p-8 space-y-5 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>Coach view</h1>
        <p className="text-sm font-semibold mt-0.5" style={{ color: '#94A3B8' }}>Check-in &amp; attendance</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Location picker */}
        <select
          value={locationId}
          onChange={e => setLocationId(parseInt(e.target.value))}
          className="input"
          style={{ maxWidth: '160px' }}
        >
          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        {/* Date navigator */}
        <div className="flex items-center gap-1">
          <button onClick={() => setDate(d => offsetDate(d, -1))}
            className="btn btn-secondary p-2"><ChevronLeft size={16} /></button>
          <button onClick={() => setDate(todayStr())}
            className="btn btn-secondary px-3 text-xs font-bold">Today</button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="input" style={{ maxWidth: '140px' }} />
          <button onClick={() => setDate(d => offsetDate(d, 1))}
            className="btn btn-secondary p-2"><ChevronRight size={16} /></button>
        </div>
      </div>

      <p className="text-sm font-bold" style={{ color: '#64748B' }}>{formatDate(date)}</p>

      {/* Sessions */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="card p-5 skeleton" style={{ height: '72px' }} />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="font-semibold" style={{ color: '#94A3B8' }}>No sessions scheduled for this day</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => {
            const checkedIn = session.reservations.filter(r => r.attendance).length
            const total = session.reservations.length
            const meals = session.reservations.filter(r => r.attendance?.lunch).length
            const isOpen = expandedSession === session.id
            const color = creditColor(session.creditType)

            return (
              <div key={session.id} className="card overflow-hidden">
                {/* Session header */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 text-left"
                  onClick={() => setExpandedSession(isOpen ? null : session.id)}
                >
                  <div className="w-1.5 self-stretch rounded-full shrink-0" style={{ background: color }} />
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: '#0A1628' }}>{session.name}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                      <Clock size={11} className="inline mr-1" />
                      {session.startTime} – {session.endTime}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="font-black text-lg leading-none" style={{ color: checkedIn === total && total > 0 ? '#22C55E' : '#0A1628' }}>
                      {checkedIn}<span className="text-sm font-bold" style={{ color: '#94A3B8' }}>/{total}</span>
                    </p>
                    <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>kids</p>
                    {meals > 0 && (
                      <p className="text-xs font-bold flex items-center justify-end gap-1" style={{ color: '#F59E0B' }}>
                        <Utensils size={10} />{meals} meal{meals !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </button>

                {/* Student list */}
                {isOpen && (
                  <div className="border-t" style={{ borderColor: '#E2E8F0' }}>
                    {session.reservations.length === 0 && (
                      <p className="px-5 py-4 text-sm font-semibold" style={{ color: '#94A3B8' }}>
                        No reservations yet
                      </p>
                    )}
                    {session.reservations.map(r => {
                      const done = !!r.attendance
                      const credits = creditsLeft(r.student, session.creditType)
                      return (
                        <div key={r.id} className="flex items-center gap-3 px-5 py-3 border-b last:border-0"
                          style={{ borderColor: '#F1F5F9', background: done ? '#F8FFF0' : 'white' }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-black"
                            style={{ background: done ? '#CCFF00' : '#F1F5F9', color: '#0A1628' }}>
                            {done
                              ? <CheckCircle size={17} style={{ color: '#22c55e' }} />
                              : r.student.name.split(' ').map(w => w[0]).join('').slice(0, 2)
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm" style={{ color: '#0A1628' }}>{r.student.name}</p>
                            <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                              Age {r.student.age} ·{' '}
                              <span style={{ color: credits > 0 ? color : '#F87171', fontWeight: 800 }}>
                                {credits} credit{credits !== 1 ? 's' : ''} left
                              </span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => openPackModal(r.student.id, r.student.name)}
                              title="Add package"
                              className="btn btn-secondary p-2"
                            >
                              <PackagePlus size={14} />
                            </button>
                            {!done && (
                              <button
                                disabled={checkingIn === r.student.id}
                                onClick={() => checkIn(r.student, session.id, session.creditType)}
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                              >
                                {checkingIn === r.student.id ? '…' : 'Check in'}
                              </button>
                            )}
                            {done && (
                              <span className="badge badge-green">✓ In</span>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Add student button */}
                    <div className="px-5 py-3">
                      <button
                        onClick={() => {
                          setAddModal({ sessionId: session.id, creditType: session.creditType })
                          setAddStudentId('')
                          setAddDropIn(false)
                          setAddDropInAmount('')
                          setAddLunch(false)
                          setAddError('')
                        }}
                        className="btn btn-secondary w-full"
                        style={{ fontSize: '0.8rem' }}
                      >
                        <UserPlus size={14} className="mr-1.5" /> Add student
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add student modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
              <h3 className="font-display font-semibold" style={{ color: '#0A1628' }}>Add to session</h3>
              <button onClick={() => setAddModal(null)} className="text-slate-400 font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleAddStudent} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Student</label>
                <select value={addStudentId} onChange={e => setAddStudentId(e.target.value)} className="input" required>
                  <option value="">Select student…</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (age {s.age})</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={addDropIn} onChange={e => setAddDropIn(e.target.checked)}
                  className="w-4 h-4 rounded" />
                <span className="text-sm font-bold" style={{ color: '#0A1628' }}>
                  <CreditCard size={14} className="inline mr-1" />Drop-in (no pack)
                </span>
              </label>

              {addDropIn && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
                    Amount paid (฿)
                  </label>
                  <input type="number" value={addDropInAmount} onChange={e => setAddDropInAmount(e.target.value)}
                    placeholder="600" required className="input" />
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={addLunch} onChange={e => setAddLunch(e.target.checked)}
                  className="w-4 h-4 rounded" />
                <span className="text-sm font-bold" style={{ color: '#0A1628' }}>
                  <Utensils size={14} className="inline mr-1" />Lunch included
                </span>
              </label>

              {addError && <p className="text-sm font-bold" style={{ color: '#DC2626' }}>{addError}</p>}

              <div className="flex gap-3">
                <button type="submit" disabled={addLoading} className="btn btn-primary flex-1">
                  {addLoading ? 'Adding…' : 'Check in'}
                </button>
                <button type="button" onClick={() => setAddModal(null)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add package modal */}
      {packModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
              <div>
                <h3 className="font-display font-semibold" style={{ color: '#0A1628' }}>Add package</h3>
                <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>{packModal.studentName}</p>
              </div>
              <button onClick={() => setPackModal(null)} className="text-slate-400 font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleAddPack} className="p-5 space-y-4">

              {/* Package picker */}
              {packPrices.length === 0 ? (
                <p className="text-sm font-semibold text-center py-4" style={{ color: '#94A3B8' }}>Loading…</p>
              ) : (
                <div className="space-y-2">
                  {packPrices.map(p => (
                    <button key={p.id} type="button" onClick={() => { setPackSelected(p); setPackPricePaid(p.price.toString()) }}
                      className="w-full text-left p-3 rounded-xl border-2 transition-all"
                      style={packSelected?.id === p.id
                        ? { borderColor: '#00C2E0', background: '#00C2E015' }
                        : { borderColor: '#E2E8F0', background: '#fff' }
                      }>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-sm" style={{ color: '#0A1628' }}>{p.label}</p>
                          <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                            {p.credits} credits · {p.validityMonths} month{p.validityMonths !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <p className="font-black text-base shrink-0" style={{ color: '#0A1628' }}>฿{p.price.toLocaleString()}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {packSelected && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Price paid (฿)</label>
                      <input type="number" value={packPricePaid} onChange={e => setPackPricePaid(e.target.value)}
                        required min={0} className="input" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Payment method</label>
                      <select value={packMethod} onChange={e => setPackMethod(e.target.value)} className="input">
                        <option value="CASH">Cash</option>
                        <option value="TRANSFER">Transfer</option>
                        <option value="QR_PROMPTPAY">QR PromptPay</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
                      Note / Transaction ref.
                    </label>
                    <input type="text" value={packNote} onChange={e => setPackNote(e.target.value)}
                      placeholder="e.g. transfer received 21/04, ref. xxxx" className="input" />
                    <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                      Add the transfer reference or cash payment date
                    </p>
                  </div>
                </>
              )}

              {packError && <p className="text-sm font-bold" style={{ color: '#DC2626' }}>{packError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={packLoading || !packSelected} className="btn btn-primary flex-1">
                  {packLoading ? 'Adding…' : 'Add pack'}
                </button>
                <button type="button" onClick={() => setPackModal(null)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
