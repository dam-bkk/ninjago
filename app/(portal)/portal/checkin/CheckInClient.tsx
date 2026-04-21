'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'react-qr-code'
import { ChevronLeft, ChevronRight, QrCode, AlertCircle, RefreshCw } from 'lucide-react'
import { useLang, t } from '@/lib/lang-context'

type Location = { id: number; name: string }
type Package = {
  id: number; creditType: string; totalCredits: number
  usedCredits: number; expiresAt: Date | string | null; groupLabel: string | null
}
type Student = {
  id: number; name: string; age: number | null; photoUrl: string | null
  locations: { location: Location }[]
  packages: { isPrimary: boolean; package: Package }[]
}
type Session = {
  id: number; name: string; startTime: string; endTime: string
  dayOfWeek: number | null; creditType: string
  location: { id: number; name: string }
}
type Parent = {
  id: number; name: string | null; phone: string
  students: Student[]
}

const DAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const CREDIT_COLOR: Record<string, string> = {
  CLASS: '#00C2E0', CAMP: '#CCFF00', CAMP_EXTENDED: '#FFB400',
}

function creditLabel(ct: string) {
  return ct === 'CLASS' ? 'Class' : ct === 'CAMP' ? 'Camp' : 'Ext Camp'
}

function nextOccurrence(dayOfWeek: number | null): string {
  const today = new Date()
  if (dayOfWeek === null) return today.toISOString().split('T')[0]
  const todayDow = today.getDay()
  let diff = dayOfWeek - todayDow
  if (diff < 0) diff += 7
  const d = new Date(today)
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

const STEPS_MULTI  = ['student', 'session', 'package'] as const
const STEPS_SINGLE = ['session', 'package'] as const
const STEP_LABELS: Record<string, string> = {
  student: 'Child', session: 'Session', package: 'Package',
}

export default function CheckInClient({ parent, sessions }: { parent: Parent; sessions: Session[] }) {
  const router = useRouter()
  const { lang } = useLang()

  const isMulti = parent.students.length > 1
  const steps = isMulti ? STEPS_MULTI : STEPS_SINGLE

  const [step, setStep]               = useState<'student' | 'session' | 'package' | 'qr'>(steps[0])
  const [student, setStudent]         = useState<Student | null>(isMulti ? null : parent.students[0])
  const [session, setSession]         = useState<Session | null>(null)
  const [pkg, setPkg]                 = useState<Package | null>(null)
  const [date, setDate]               = useState<string>('')
  const [token, setToken]             = useState<string | null>(null)
  const [generating, setGenerating]   = useState(false)
  const [error, setError]             = useState('')

  const studentLocationIds = student?.locations.map(l => l.location.id) ?? []
  const availableSessions  = sessions.filter(s => studentLocationIds.includes(s.location.id))

  const matchingPackages = session
    ? (student?.packages ?? [])
        .map(sp => sp.package)
        .filter(p => p.creditType === session.creditType && p.usedCredits < p.totalCredits)
    : []

  function selectStudent(s: Student) {
    setStudent(s); setSession(null); setPkg(null); setToken(null); setStep('session')
  }
  function selectSession(s: Session) {
    setSession(s); setDate(nextOccurrence(s.dayOfWeek)); setPkg(null); setToken(null); setStep('package')
  }
  function selectPackage(p: Package) {
    setPkg(p); setToken(null); setStep('qr')
  }

  useEffect(() => {
    if (step === 'qr' && student && session && pkg && date && !token) {
      setGenerating(true); setError('')
      fetch('/api/portal/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, sessionId: session.id, packageId: pkg.id, date }),
      })
        .then(r => r.json())
        .then(data => { if (data.token) setToken(data.token); else setError(data.error ?? 'Error') })
        .catch(() => setError('Network error'))
        .finally(() => setGenerating(false))
    }
  }, [step, student, session, pkg, date, token])

  const scanUrl   = token ? `${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${token}` : ''
  const dateLabel = date
    ? new Date(date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : ''

  function reset() {
    setToken(null); setError('')
    if (isMulti) { setStep('student'); setStudent(null); setSession(null); setPkg(null) }
    else          { setStep('session'); setSession(null); setPkg(null) }
  }

  const currentStepIdx = step === 'qr' ? -1 : steps.indexOf(step as typeof steps[number])

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-10 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/portal')}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.50)', color: '#0A1628' }}>
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 text-center">
          <h1 className="font-display font-semibold text-xl" style={{ color: '#0A1628' }}>QR Check-in</h1>
          <p className="text-xs font-semibold" style={{ color: 'rgba(10,22,40,0.50)' }}>
            Share with your nanny or guardian
          </p>
        </div>
        {/* spacer to balance the back button */}
        <div className="w-9" />
      </div>

      {/* Step indicator */}
      {step !== 'qr' && (
        <div className="flex items-center justify-center gap-0">
          {steps.map((s, i) => {
            const isDone   = i < currentStepIdx
            const isActive = s === step
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all"
                    style={isDone
                      ? { background: '#CCFF00', color: '#0A1628' }
                      : isActive
                        ? { background: '#0A1628', color: '#CCFF00' }
                        : { background: 'rgba(255,255,255,0.40)', color: 'rgba(10,22,40,0.35)' }}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span className="text-xs font-bold" style={{ color: isActive ? '#0A1628' : 'rgba(10,22,40,0.35)' }}>
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="w-12 h-0.5 mb-4 mx-1" style={{ background: isDone ? '#0A1628' : 'rgba(10,22,40,0.15)' }} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── STEP: Student ── */}
      {step === 'student' && (
        <div className="space-y-3">
          <p className="text-center font-display font-semibold text-lg" style={{ color: '#0A1628' }}>Which child?</p>
          {parent.students.map(s => (
            <button key={s.id} onClick={() => selectStudent(s)}
              className="portal-card w-full text-left p-4 flex items-center gap-4 transition-all active:scale-98">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0"
                style={{ background: '#F1F5F9', color: '#0A1628' }}>
                {s.photoUrl
                  ? <img src={s.photoUrl} className="w-12 h-12 rounded-2xl object-cover" alt={s.name} />
                  : s.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base" style={{ color: '#0A1628' }}>{s.name}</p>
                {s.age && <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>{s.age} y.o.</p>}
              </div>
              <ChevronRight size={18} style={{ color: '#CBD5E1' }} />
            </button>
          ))}
        </div>
      )}

      {/* ── STEP: Session ── */}
      {step === 'session' && (
        <div className="space-y-3">
          {student && (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                style={{ background: '#CCFF00', color: '#0A1628' }}>
                {student.name[0]}
              </div>
              <p className="font-semibold text-sm" style={{ color: '#0A1628' }}>{student.name}</p>
            </div>
          )}
          <p className="text-center font-display font-semibold text-lg" style={{ color: '#0A1628' }}>Pick a session</p>
          {availableSessions.length === 0 ? (
            <div className="portal-card p-8 text-center">
              <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>No sessions available</p>
            </div>
          ) : (
            availableSessions.map(s => {
              const nextDate = nextOccurrence(s.dayOfWeek)
              const color    = CREDIT_COLOR[s.creditType] ?? '#94A3B8'
              return (
                <button key={s.id} onClick={() => selectSession(s)}
                  className="portal-card w-full text-left p-4 flex items-center gap-4 transition-all active:scale-98">
                  <div className="w-1.5 self-stretch rounded-full shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: '#0A1628' }}>{s.name}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                      {s.dayOfWeek !== null ? DAYS_EN[s.dayOfWeek] : 'Any'} · {s.startTime}–{s.endTime}
                    </p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                      {s.location.name} · next: {new Date(nextDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <ChevronRight size={18} style={{ color: '#CBD5E1' }} />
                </button>
              )
            })
          )}
        </div>
      )}

      {/* ── STEP: Package ── */}
      {step === 'package' && session && (
        <div className="space-y-3">
          {/* Selected session pill */}
          <div className="portal-card p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm" style={{ color: '#0A1628' }}>{session.name}</p>
              <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>{dateLabel}</p>
            </div>
            <button onClick={() => setStep('session')}
              className="text-xs font-bold px-2.5 py-1 rounded-lg shrink-0"
              style={{ background: '#F1F5F9', color: '#64748B' }}>
              Change
            </button>
          </div>

          <p className="text-center font-display font-semibold text-lg" style={{ color: '#0A1628' }}>Which package?</p>

          {matchingPackages.length === 0 ? (
            <div className="portal-card p-8 flex flex-col items-center gap-3 text-center">
              <AlertCircle size={28} style={{ color: '#F59E0B' }} />
              <p className="text-sm font-bold" style={{ color: '#0A1628' }}>No credits available</p>
              <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                No {creditLabel(session.creditType)} package with remaining credits
              </p>
            </div>
          ) : (
            matchingPackages.map(p => {
              const remaining = p.totalCredits - p.usedCredits
              const color     = CREDIT_COLOR[p.creditType] ?? '#94A3B8'
              const expiry    = p.expiresAt
                ? new Date(p.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                : null
              return (
                <button key={p.id} onClick={() => selectPackage(p)}
                  className="portal-card w-full text-left p-4 flex items-center gap-4 transition-all active:scale-98">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0"
                    style={{ background: color, color: '#0A1628' }}>
                    {remaining}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: '#0A1628' }}>
                      {p.groupLabel ?? creditLabel(p.creditType)}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                      {remaining}/{p.totalCredits} credits{expiry ? ` · exp. ${expiry}` : ''}
                    </p>
                  </div>
                  <ChevronRight size={18} style={{ color: '#CBD5E1' }} />
                </button>
              )
            })
          )}
        </div>
      )}

      {/* ── STEP: QR Code ── */}
      {step === 'qr' && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="portal-card p-4 flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <p className="font-bold text-sm" style={{ color: '#0A1628' }}>{student?.name}</p>
              <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>{session?.name} · {dateLabel}</p>
              <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                {pkg?.groupLabel ?? (pkg ? creditLabel(pkg.creditType) : '')} · {pkg ? pkg.totalCredits - pkg.usedCredits : 0} credits left
              </p>
            </div>
            <button onClick={reset}
              className="text-xs font-bold px-2.5 py-1 rounded-lg shrink-0"
              style={{ background: '#F1F5F9', color: '#64748B' }}>
              Reset
            </button>
          </div>

          {generating && (
            <div className="portal-card p-12 flex flex-col items-center gap-3">
              <RefreshCw size={32} className="animate-spin" style={{ color: '#CBD5E1' }} />
              <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>Generating QR…</p>
            </div>
          )}

          {error && (
            <div className="portal-card p-8 flex flex-col items-center gap-3 text-center">
              <AlertCircle size={32} style={{ color: '#EF4444' }} />
              <p className="text-sm font-bold" style={{ color: '#0A1628' }}>{error}</p>
              <button onClick={() => { setError(''); setToken(null) }} className="btn-ninja text-sm px-5 py-2.5">
                Retry
              </button>
            </div>
          )}

          {token && !error && (
            <div className="space-y-4">
              {/* QR */}
              <div className="portal-card p-6 flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-sm">
                  <QRCode value={scanUrl} size={210} />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-bold text-sm" style={{ color: '#0A1628' }}>Show this QR to the coach</p>
                  <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>Valid today · Single use</p>
                </div>
              </div>

              {/* Share */}
              <div className="space-y-2">
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    onClick={() => navigator.share({ title: `QR Check-in – ${student?.name}`, url: scanUrl })}
                    className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-98"
                    style={{ background: '#0A1628', color: '#CCFF00' }}>
                    <QrCode size={17} /> Share link
                  </button>
                )}
                <a href={`https://wa.me/?text=${encodeURIComponent(`QR Check-in for ${student?.name}:\n${scanUrl}`)}`}
                  target="_blank" rel="noreferrer"
                  className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-98"
                  style={{ background: '#25D366', color: '#fff' }}>
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  WhatsApp
                </a>
                <a href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(scanUrl)}`}
                  target="_blank" rel="noreferrer"
                  className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-98"
                  style={{ background: '#06C755', color: '#fff' }}>
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="white"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.630 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.630 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                  LINE
                </a>
              </div>

              {/* Instructions */}
              <div className="space-y-2.5 pt-1">
                {[
                  'Share this QR with your nanny or guardian',
                  'The coach scans the QR at the door',
                  '1 credit is automatically deducted',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0"
                      style={{ background: '#0A1628', color: '#CCFF00' }}>{i + 1}</div>
                    <p className="text-sm font-semibold leading-relaxed" style={{ color: '#0A1628' }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
