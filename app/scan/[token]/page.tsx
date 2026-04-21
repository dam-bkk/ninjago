'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Clock, User, Package, Loader } from 'lucide-react'
import { useParams } from 'next/navigation'

type TokenData = {
  student: { id: number; name: string; age: number | null; photoUrl: string | null }
  session: { id: number; name: string; startTime: string; endTime: string; location: { name: string }; creditType: string }
  package: { id: number; creditType: string; totalCredits: number; usedCredits: number; groupLabel: string | null }
  date: string
  creditsLeft: number
}

type State =
  | { status: 'loading' }
  | { status: 'ready'; data: TokenData }
  | { status: 'error'; message: string }
  | { status: 'already_used' }
  | { status: 'expired' }
  | { status: 'confirming' }
  | { status: 'done'; studentName: string; sessionName: string; creditsAfter: number }

export default function ScanPage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    fetch(`/api/scan/${token}`)
      .then(async r => {
        const data = await r.json()
        if (r.status === 409) setState({ status: 'already_used' })
        else if (r.status === 410) setState({ status: 'expired' })
        else if (!r.ok) setState({ status: 'error', message: data.error ?? 'Error' })
        else setState({ status: 'ready', data })
      })
      .catch(() => setState({ status: 'error', message: 'Network error' }))
  }, [token])

  async function confirm() {
    setState({ status: 'confirming' })
    const r = await fetch(`/api/scan/${token}`, { method: 'POST' })
    const data = await r.json()
    if (r.status === 409) { setState({ status: 'already_used' }); return }
    if (!r.ok) { setState({ status: 'error', message: data.error ?? 'Error' }); return }
    setState({ status: 'done', studentName: data.student.name, sessionName: data.session.name, creditsAfter: data.creditsAfter })
  }

  const dateLabel = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: '#F0F4F8' }}>

      {/* Brand */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: '#0A1628' }}>
          <span style={{ fontSize: '1.1rem' }}>🥷</span>
        </div>
        <span className="font-display font-semibold text-lg" style={{ color: '#0A1628' }}>Ninja Academy</span>
      </div>

      <div className="w-full max-w-sm space-y-4">

        {/* Loading */}
        {state.status === 'loading' && (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm space-y-3">
            <Loader size={32} className="animate-spin mx-auto" style={{ color: '#CBD5E1' }} />
            <p className="font-semibold text-sm" style={{ color: '#94A3B8' }}>Verifying…</p>
          </div>
        )}

        {/* Already used */}
        {state.status === 'already_used' && (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm space-y-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: '#FEF3C7' }}>
              <AlertCircle size={28} style={{ color: '#D97706' }} />
            </div>
            <p className="font-display font-semibold text-xl" style={{ color: '#0A1628' }}>Already used</p>
            <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>
              This QR code has already been scanned.
            </p>
          </div>
        )}

        {/* Expired */}
        {state.status === 'expired' && (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm space-y-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: '#FEF2F2' }}>
              <Clock size={28} style={{ color: '#EF4444' }} />
            </div>
            <p className="font-display font-semibold text-xl" style={{ color: '#0A1628' }}>Expired</p>
            <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>
              This QR code has expired. The parent must generate a new one.
            </p>
          </div>
        )}

        {/* Error */}
        {state.status === 'error' && (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm space-y-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: '#FEF2F2' }}>
              <AlertCircle size={28} style={{ color: '#EF4444' }} />
            </div>
            <p className="font-display font-semibold text-xl" style={{ color: '#0A1628' }}>Error</p>
            <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>{state.message}</p>
          </div>
        )}

        {/* Ready — show info + confirm button */}
        {(state.status === 'ready' || state.status === 'confirming') && state.status !== 'confirming' && (
          <>
            {/* Student card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0"
                  style={{ background: '#F1F5F9', color: '#0A1628' }}>
                  {(state as { status: 'ready'; data: TokenData }).data.student.photoUrl
                    ? <img src={(state as { status: 'ready'; data: TokenData }).data.student.photoUrl!} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                    : (state as { status: 'ready'; data: TokenData }).data.student.name[0]}
                </div>
                <div>
                  <p className="font-display font-semibold text-xl" style={{ color: '#0A1628' }}>
                    {(state as { status: 'ready'; data: TokenData }).data.student.name}
                  </p>
                  {(state as { status: 'ready'; data: TokenData }).data.student.age && (
                    <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>
                      {(state as { status: 'ready'; data: TokenData }).data.student.age} y.o.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t" style={{ borderColor: '#F1F5F9' }}>
                <Row icon={<User size={14} />} label="Session"
                  value={`${(state as { status: 'ready'; data: TokenData }).data.session.name} · ${(state as { status: 'ready'; data: TokenData }).data.session.startTime}–${(state as { status: 'ready'; data: TokenData }).data.session.endTime}`} />
                <Row icon={<Clock size={14} />} label="Date"
                  value={dateLabel((state as { status: 'ready'; data: TokenData }).data.date)} />
                <Row icon={<Package size={14} />} label="Package"
                  value={`${(state as { status: 'ready'; data: TokenData }).data.package.groupLabel ?? (state as { status: 'ready'; data: TokenData }).data.session.creditType} · ${(state as { status: 'ready'; data: TokenData }).data.creditsLeft} credits`} />
              </div>
            </div>

            <button onClick={confirm}
              className="w-full py-5 rounded-2xl font-display font-semibold text-xl transition-all active:scale-97 shadow-lg"
              style={{ background: '#CCFF00', color: '#0A1628' }}>
              ✓ Confirm check-in
            </button>
            <p className="text-center text-xs font-semibold" style={{ color: '#94A3B8' }}>
              1 credit will be deducted
            </p>
          </>
        )}

        {/* Confirming */}
        {state.status === 'confirming' && (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm space-y-3">
            <Loader size={32} className="animate-spin mx-auto" style={{ color: '#CCFF00' }} />
            <p className="font-semibold text-sm" style={{ color: '#94A3B8' }}>Checking in…</p>
          </div>
        )}

        {/* Done */}
        {state.status === 'done' && (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm space-y-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{ background: '#CCFF00' }}>
              <CheckCircle size={36} style={{ color: '#0A1628' }} />
            </div>
            <div>
              <p className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>Check-in ✓</p>
              <p className="font-bold text-lg mt-1" style={{ color: '#0A1628' }}>
                {(state as { status: 'done'; studentName: string; sessionName: string; creditsAfter: number }).studentName}
              </p>
              <p className="text-sm font-semibold mt-1" style={{ color: '#94A3B8' }}>
                {(state as { status: 'done'; studentName: string; sessionName: string; creditsAfter: number }).sessionName}
              </p>
            </div>
            <div className="rounded-2xl px-4 py-3 inline-flex items-center gap-2"
              style={{ background: '#F0FDF4' }}>
              <span className="font-black text-2xl" style={{ color: '#16A34A' }}>
                {(state as { status: 'done'; studentName: string; sessionName: string; creditsAfter: number }).creditsAfter}
              </span>
              <span className="text-sm font-bold" style={{ color: '#16A34A' }}>credits remaining</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span style={{ color: '#94A3B8' }}>{icon}</span>
      <span className="text-xs font-semibold w-14 shrink-0" style={{ color: '#94A3B8' }}>{label}</span>
      <span className="text-sm font-bold flex-1" style={{ color: '#0A1628' }}>{value}</span>
    </div>
  )
}
