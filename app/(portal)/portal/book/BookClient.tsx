'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, MapPin, ChevronRight, CheckCircle } from 'lucide-react'
import { useLang, t } from '@/lib/lang-context'

type Session = {
  id: number; name: string; startTime: string; endTime: string
  creditType: string; dayOfWeek: number | null
  location: { id: number; name: string }
}
type StudentPkg = {
  package: { creditType: string; totalCredits: number; usedCredits: number; expiresAt: Date | string | null }
}
type Student = {
  id: number; name: string; age: number | null
  locations: { location: { id: number; name: string } }[]
  packages: StudentPkg[]
}

function creditColor(type: string) {
  return type === 'CLASS' ? '#00C2E0' : type === 'CAMP' ? '#CCFF00' : '#FFB400'
}

function creditsLeft(student: Student, creditType: string) {
  return student.packages
    .filter(sp => sp.package.creditType === creditType)
    .filter(sp => !sp.package.expiresAt || new Date(sp.package.expiresAt) > new Date())
    .reduce((acc, sp) => acc + sp.package.totalCredits - sp.package.usedCredits, 0)
}

function nextDates(dayOfWeek: number, count = 6): string[] {
  const dates: string[] = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  for (let i = 0; dates.length < count; i++) {
    const candidate = new Date(d)
    candidate.setDate(d.getDate() + i)
    if (candidate.getDay() === dayOfWeek) {
      dates.push(candidate.toISOString().split('T')[0])
    }
  }
  return dates
}

type Step = 'session' | 'date' | 'confirm' | 'done'

export default function BookClient({ sessions, students }: { sessions: Session[]; students: Student[] }) {
  const router = useRouter()
  const { lang } = useLang()
  const d = t(lang)

  const [studentIdx, setStudentIdx] = useState(0)
  const [step, setStep] = useState<Step>('session')
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const student = students[studentIdx]
  const studentLocationIds = new Set(student.locations.map(l => l.location.id))
  const visibleSessions = sessions.filter(s => studentLocationIds.has(s.location.id))

  async function confirmBooking() {
    if (!selectedSession || !selectedDate) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/portal/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          sessionId: selectedSession.id,
          locationId: selectedSession.location.id,
          date: selectedDate,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); return }
      if (data.notifyUrl) {
        try { window.open(data.notifyUrl, '_blank', 'noopener') } catch {}
      }
      setStep('done')
    } catch {
      setError(d.networkError)
    } finally {
      setLoading(false)
    }
  }

  // ── DONE ─────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="portal-card p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ background: '#CCFF00' }}>
          <CheckCircle size={32} style={{ color: '#0A1628' }} />
        </div>
        <div>
          <p className="font-display font-semibold text-xl" style={{ color: '#0A1628' }}>{d.booked}</p>
          <p className="text-sm font-semibold mt-1" style={{ color: '#5B8FA8' }}>
            {selectedSession?.name} · {selectedDate && new Date(selectedDate).toLocaleDateString(
              lang === 'th' ? 'th-TH' : lang === 'fr' ? 'fr-FR' : 'en-GB',
              { weekday: 'long', day: 'numeric', month: 'long' }
            )}
          </p>
          <p className="text-xs font-semibold mt-1" style={{ color: '#94A3B8' }}>{d.creditAtCheckin}</p>
        </div>
        <button onClick={() => router.push('/portal')} className="btn-ninja w-full font-display">
          {d.backToHome}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Student selector */}
      {students.length > 1 && (
        <div className="flex gap-2">
          {students.map((s, i) => (
            <button key={s.id}
              onClick={() => { setStudentIdx(i); setStep('session'); setSelectedSession(null); setSelectedDate(null) }}
              className="tag"
              style={i === studentIdx
                ? { background: '#0A1628', color: '#CCFF00' }
                : { background: 'rgba(255,255,255,0.30)', color: '#0A1628', border: '1.5px solid rgba(255,255,255,0.50)' }
              }>
              {s.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="flex gap-1.5">
        {(['session', 'date', 'confirm'] as Step[]).map((s, i) => (
          <div key={s} className="h-1 flex-1 rounded-full"
            style={{ background: ['session', 'date', 'confirm', 'done'].indexOf(step) >= i ? '#0A1628' : 'rgba(10,22,40,0.15)' }} />
        ))}
      </div>

      {/* ── STEP 1: Session picker ── */}
      {step === 'session' && (
        <div className="space-y-2">
          <p className="font-display font-semibold text-sm" style={{ color: '#0A1628', opacity: 0.5 }}>
            {d.chooseSession}
          </p>
          {visibleSessions.map(s => {
            const credits = creditsLeft(student, s.creditType)
            const color = creditColor(s.creditType)
            const hasCredits = credits > 0
            const creditTypeLabel = d.creditTypes[s.creditType as keyof typeof d.creditTypes] ?? s.creditType
            return (
              <button key={s.id}
                disabled={!hasCredits}
                onClick={() => { setSelectedSession(s); setStep('date') }}
                className="portal-card w-full p-4 text-left flex items-center gap-3 transition-all active:scale-98"
                style={!hasCredits ? { opacity: 0.5 } : {}}>
                <div className="w-1.5 self-stretch rounded-full shrink-0" style={{ background: color }} />
                <div className="flex-1">
                  <p className="font-display font-semibold text-sm" style={{ color: '#0A1628' }}>{s.name}</p>
                  <p className="text-xs font-semibold mt-0.5 flex items-center gap-1" style={{ color: '#5B8FA8' }}>
                    <Clock size={10} />{s.startTime} – {s.endTime}
                    <span className="mx-1">·</span>
                    <MapPin size={10} />{s.location.name}
                    <span className="mx-1">·</span>
                    {d.days[s.dayOfWeek ?? 0]}
                  </p>
                  <p className="text-xs font-bold mt-1" style={{ color: hasCredits ? color : '#F87171' }}>
                    {hasCredits ? d.creditAvailable(credits, creditTypeLabel) : d.noCredits}
                  </p>
                </div>
                {hasCredits && <ChevronRight size={16} style={{ color: '#CBD5E1', flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
      )}

      {/* ── STEP 2: Date picker ── */}
      {step === 'date' && selectedSession && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('session')}
              className="text-sm font-bold" style={{ color: 'rgba(10,22,40,0.50)' }}>{d.back}</button>
            <p className="font-display font-semibold text-sm" style={{ color: '#0A1628' }}>
              {selectedSession.name}
            </p>
          </div>
          <p className="font-display font-semibold text-sm" style={{ color: '#0A1628', opacity: 0.5 }}>
            {d.chooseDate}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {nextDates(selectedSession.dayOfWeek ?? 0, 6).map(dateStr => {
              const date = new Date(dateStr)
              const isSelected = selectedDate === dateStr
              const locale = lang === 'th' ? 'th-TH' : lang === 'fr' ? 'fr-FR' : 'en-GB'
              return (
                <button key={dateStr}
                  onClick={() => { setSelectedDate(dateStr); setStep('confirm') }}
                  className="portal-card p-4 text-left transition-all active:scale-98"
                  style={isSelected ? { background: '#0A1628' } : {}}>
                  <p className="font-display font-semibold" style={{ color: isSelected ? '#CCFF00' : '#0A1628', fontSize: '1.1rem' }}>
                    {date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-xs font-bold mt-0.5" style={{ color: isSelected ? 'rgba(255,255,255,0.60)' : '#5B8FA8' }}>
                    {d.daysFull[date.getDay()]}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STEP 3: Confirm ── */}
      {step === 'confirm' && selectedSession && selectedDate && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('date')}
              className="text-sm font-bold" style={{ color: 'rgba(10,22,40,0.50)' }}>{d.back}</button>
          </div>

          <div className="portal-card-dark p-5 space-y-4">
            <p className="font-display font-semibold text-white" style={{ fontSize: '1.1rem' }}>
              {d.confirmBooking}
            </p>
            <div className="space-y-2">
              <Row label={d.studentLabel} value={student.name} />
              <Row label={d.sessionLabel} value={selectedSession.name} />
              <Row label={d.dateLabel} value={new Date(selectedDate).toLocaleDateString(
                lang === 'th' ? 'th-TH' : lang === 'fr' ? 'fr-FR' : 'en-GB',
                { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
              )} />
              <Row label={d.timeLabel} value={`${selectedSession.startTime} – ${selectedSession.endTime}`} />
              <Row label={d.locationLabel} value={selectedSession.location.name} />
              <Row label={d.creditLabel}
                value={`1 ${d.creditTypes[selectedSession.creditType as keyof typeof d.creditTypes] ?? selectedSession.creditType}`}
                highlight />
            </div>
            <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {d.creditNote}
            </p>
          </div>

          {error && <p className="text-sm font-bold" style={{ color: '#DC2626' }}>{error}</p>}

          <button onClick={confirmBooking} disabled={loading}
            className="btn-ninja w-full font-display" style={{ fontSize: '1rem', fontWeight: 600 }}>
            {loading ? '…' : `${d.confirmBooking} ⚡`}
          </button>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.40)' }}>{label}</span>
      <span className="text-xs font-bold" style={{ color: highlight ? '#CCFF00' : 'rgba(255,255,255,0.85)' }}>{value}</span>
    </div>
  )
}
