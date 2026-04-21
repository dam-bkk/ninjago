'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, Clock, UserPlus, ChevronLeft, ChevronRight, Utensils, CreditCard, Loader } from 'lucide-react'

type Student = { id: number; name: string; age: number | null }
type ReservationData = {
  id: number
  status: string
  student: {
    id: number; name: string; age: number | null
    packages: { package: { creditType: string; totalCredits: number; usedCredits: number } }[]
  }
  attendance: { id: number; lunch: boolean } | null
}
type SessionData = {
  id: number; name: string; startTime: string; endTime: string; creditType: string
  reservations: ReservationData[]
}

function todayStr() { return new Date().toISOString().split('T')[0] }
function offsetDate(base: string, days: number) {
  const d = new Date(base); d.setDate(d.getDate() + days); return d.toISOString().split('T')[0]
}
function formatDate(str: string) {
  return new Date(str).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}
function creditsLeft(student: ReservationData['student'], creditType: string) {
  return student.packages
    .filter(sp => sp.package.creditType === creditType)
    .reduce((acc, sp) => acc + sp.package.totalCredits - sp.package.usedCredits, 0)
}

const creditColor = (t: string) =>
  t === 'CLASS' ? '#00C2E0' : t === 'CAMP' ? '#CCFF00' : '#FFB400'

export default function CoachStationPage() {
  const { token } = useParams<{ token: string }>()
  const [date, setDate] = useState(todayStr())
  const [locationName, setLocationName] = useState('')
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [invalid, setInvalid] = useState(false)
  const [expandedSession, setExpandedSession] = useState<number | null>(null)
  const [checkingIn, setCheckingIn] = useState<number | null>(null)

  // Add student modal
  const [addModal, setAddModal] = useState<{ sessionId: number; creditType: string } | null>(null)
  const [addStudentId, setAddStudentId] = useState('')
  const [addDropIn, setAddDropIn] = useState(false)
  const [addDropInAmount, setAddDropInAmount] = useState('')
  const [addLunch, setAddLunch] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/coach-station/${token}?date=${date}`)
      if (res.status === 404) { setInvalid(true); return }
      const data = await res.json()
      setLocationName(data.location?.name ?? '')
      setSessions(data.sessions ?? [])
      setStudents(data.students ?? [])
      if (data.sessions?.length > 0 && expandedSession === null) {
        setExpandedSession(data.sessions[0].id)
      }
    } finally {
      setLoading(false)
    }
  }, [token, date])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  async function checkIn(student: ReservationData['student'], sessionId: number) {
    setCheckingIn(student.id)
    try {
      await fetch(`/api/coach-station/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, sessionId, date, isDropIn: false, lunch: false }),
      })
      fetchSessions()
    } finally {
      setCheckingIn(null)
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault()
    if (!addModal || !addStudentId) { setAddError('Select a student'); return }
    setAddError(''); setAddLoading(true)
    try {
      const res = await fetch(`/api/coach-station/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: parseInt(addStudentId),
          sessionId: addModal.sessionId,
          date,
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

  if (invalid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#F0F4F8' }}>
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-sm">
          <p className="font-display font-semibold text-xl" style={{ color: '#0A1628' }}>Invalid QR</p>
          <p className="text-sm font-semibold mt-2" style={{ color: '#94A3B8' }}>This QR code does not match any location.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#F0F4F8' }}>

      {/* Header */}
      <div className="sticky top-0 z-10 border-b" style={{ background: '#0A1628', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#CCFF00' }}>
              <span style={{ fontSize: '1rem' }}>🥷</span>
            </div>
            <div>
              <p className="font-display font-semibold text-white text-sm leading-tight">Ninja Academy</p>
              {locationName && <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>{locationName}</p>}
            </div>
          </div>
          {/* Date nav */}
          <div className="flex items-center gap-1">
            <button onClick={() => setDate(d => offsetDate(d, -1))}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setDate(todayStr())}
              className="px-3 h-8 rounded-xl text-xs font-bold transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
              Today
            </button>
            <button onClick={() => setDate(d => offsetDate(d, 1))}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        <p className="text-sm font-bold capitalize" style={{ color: '#64748B' }}>{formatDate(date)}</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size={28} className="animate-spin" style={{ color: '#CBD5E1' }} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="font-semibold" style={{ color: '#94A3B8' }}>No sessions today</p>
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
                <div key={session.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <button className="w-full flex items-center gap-4 px-5 py-4 text-left"
                    onClick={() => setExpandedSession(isOpen ? null : session.id)}>
                    <div className="w-1.5 self-stretch rounded-full shrink-0" style={{ background: color }} />
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: '#0A1628' }}>{session.name}</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                        <Clock size={11} className="inline mr-1" />
                        {session.startTime} – {session.endTime}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-xl leading-none"
                        style={{ color: checkedIn === total && total > 0 ? '#22C55E' : '#0A1628' }}>
                        {checkedIn}<span className="text-sm font-bold" style={{ color: '#94A3B8' }}>/{total}</span>
                      </p>
                      {meals > 0 && (
                        <p className="text-xs font-bold flex items-center justify-end gap-1 mt-0.5" style={{ color: '#F59E0B' }}>
                          <Utensils size={10} />{meals}
                        </p>
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t" style={{ borderColor: '#F1F5F9' }}>
                      {session.reservations.length === 0 && (
                        <p className="px-5 py-4 text-sm font-semibold" style={{ color: '#94A3B8' }}>No reservations</p>
                      )}
                      {session.reservations.map(r => {
                        const done = !!r.attendance
                        const credits = creditsLeft(r.student, session.creditType)
                        return (
                          <div key={r.id} className="flex items-center gap-3 px-5 py-3 border-b last:border-0"
                            style={{ borderColor: '#F1F5F9', background: done ? '#F8FFF0' : 'white' }}>
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-sm font-black"
                              style={{ background: done ? '#CCFF00' : '#F1F5F9', color: '#0A1628' }}>
                              {done
                                ? <CheckCircle size={18} style={{ color: '#22c55e' }} />
                                : r.student.name.split(' ').map(w => w[0]).join('').slice(0, 2)
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm" style={{ color: '#0A1628' }}>{r.student.name}</p>
                              <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                                {r.student.age}y ·{' '}
                                <span style={{ color: credits > 0 ? color : '#F87171', fontWeight: 800 }}>
                                  {credits} credit{credits !== 1 ? 's' : ''}
                                </span>
                              </p>
                            </div>
                            {!done ? (
                              <button
                                disabled={checkingIn === r.student.id}
                                onClick={() => checkIn(r.student, session.id)}
                                className="shrink-0 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95"
                                style={{ background: '#CCFF00', color: '#0A1628' }}>
                                {checkingIn === r.student.id ? '…' : '✓ Check'}
                              </button>
                            ) : (
                              <span className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold"
                                style={{ background: '#DCFCE7', color: '#16A34A' }}>✓ Present</span>
                            )}
                          </div>
                        )
                      })}

                      <div className="px-5 py-3">
                        <button
                          onClick={() => {
                            setAddModal({ sessionId: session.id, creditType: session.creditType })
                            setAddStudentId(''); setAddDropIn(false)
                            setAddDropInAmount(''); setAddLunch(false); setAddError('')
                          }}
                          className="w-full py-2.5 rounded-xl border font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                          style={{ borderColor: '#E2E8F0', color: '#475569' }}>
                          <UserPlus size={15} /> Add student
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add student modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
              <h3 className="font-display font-semibold" style={{ color: '#0A1628' }}>Add to session</h3>
              <button onClick={() => setAddModal(null)} className="text-slate-400 font-bold text-xl">✕</button>
            </div>
            <form onSubmit={handleAddStudent} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Student</label>
                <select value={addStudentId} onChange={e => setAddStudentId(e.target.value)} className="input" required>
                  <option value="">Select…</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.age}y)</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={addDropIn} onChange={e => setAddDropIn(e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm font-bold" style={{ color: '#0A1628' }}>
                  <CreditCard size={14} className="inline mr-1" />Drop-in (no pack)
                </span>
              </label>
              {addDropIn && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Amount (฿)</label>
                  <input type="number" value={addDropInAmount} onChange={e => setAddDropInAmount(e.target.value)}
                    placeholder="600" required className="input" />
                </div>
              )}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={addLunch} onChange={e => setAddLunch(e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm font-bold" style={{ color: '#0A1628' }}>
                  <Utensils size={14} className="inline mr-1" />Déjeuner inclus
                </span>
              </label>
              {addError && <p className="text-sm font-bold" style={{ color: '#DC2626' }}>{addError}</p>}
              <div className="flex gap-3">
                <button type="submit" disabled={addLoading}
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                  style={{ background: '#0A1628', color: '#CCFF00' }}>
                  {addLoading ? '…' : 'Check-in'}
                </button>
                <button type="button" onClick={() => setAddModal(null)}
                  className="px-5 py-3 rounded-xl font-bold text-sm border transition-colors"
                  style={{ borderColor: '#E2E8F0', color: '#475569' }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
