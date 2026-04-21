'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Check, X, ChevronDown, Calendar, Users, Phone } from 'lucide-react'

type Inquiry = {
  id: number
  parentName: string
  phone: string
  email: string | null
  commApp: string | null
  lineId: string | null
  kidName: string
  kidGender: string | null
  kidAge: number
  favSuperhero: string | null
  favColor: string | null
  kid2Name: string | null
  kid2Age: number | null
  guestCount: number | null
  preferredDate: string | null
  preferredTime: string | null
  notes: string | null
  isMember: boolean
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  createdAt: string
  location: { name: string } | null
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: '#FFF7ED', color: '#C2410C', label: 'Pending'   },
  CONFIRMED: { bg: '#F0FFF4', color: '#15803D', label: 'Confirmed' },
  CANCELLED: { bg: '#FFF1F2', color: '#9F1239', label: 'Cancelled' },
}

function waPhone(raw: string) { return raw.replace(/[\s\-().]/g, '') }

function DetailModal({ inquiry, onClose, onUpdate }: {
  inquiry: Inquiry
  onClose: () => void
  onUpdate: (updated: Inquiry) => void
}) {
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState(inquiry.notes ?? '')

  async function setStatus(status: 'CONFIRMED' | 'CANCELLED') {
    setSaving(true)
    const res = await fetch(`/api/admin/birthday/${inquiry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    })
    const { inquiry: updated } = await res.json()
    onUpdate(updated)
    setSaving(false)
  }

  async function saveNotes() {
    await fetch(`/api/admin/birthday/${inquiry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
  }

  const s = STATUS_STYLES[inquiry.status]
  const dateLabel = inquiry.preferredDate
    ? new Date(inquiry.preferredDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-5 border-b flex items-start justify-between gap-3" style={{ borderColor: '#E2E8F0' }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-lg">🎂</span>
              <p className="font-display font-semibold text-base" style={{ color: '#0A1628' }}>
                {inquiry.kidName}{inquiry.kid2Name ? ` & ${inquiry.kid2Name}` : ''}
              </p>
            </div>
            <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
              {inquiry.parentName} · {inquiry.phone}
              {inquiry.isMember && <span className="ml-2 px-1.5 py-0.5 rounded-md text-xs font-bold" style={{ background: '#CCFF00', color: '#0A1628' }}>Member</span>}
            </p>
          </div>
          <button onClick={onClose}><X size={20} style={{ color: '#94A3B8' }} /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: s.bg, color: s.color }}>
              {s.label}
            </span>
            <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
              Received {new Date(inquiry.createdAt).toLocaleDateString('en-GB')}
            </span>
          </div>

          {/* Kid info */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: '#F8FAFC' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>Kid(s)</p>
            <Row label="Name" value={`${inquiry.kidName}${inquiry.kidGender ? ` (${inquiry.kidGender})` : ''}`} />
            <Row label="Turning age" value={`${inquiry.kidAge}`} />
            {inquiry.favSuperhero && <Row label="Fav. superhero" value={inquiry.favSuperhero} />}
            {inquiry.favColor && <Row label="Fav. color" value={inquiry.favColor} />}
            {inquiry.kid2Name && <Row label="2nd kid" value={`${inquiry.kid2Name}${inquiry.kid2Age ? `, ${inquiry.kid2Age}` : ''}`} />}
          </div>

          {/* Event info */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: '#F8FAFC' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>Event</p>
            <Row label="Preferred date" value={dateLabel} />
            {inquiry.preferredTime && <Row label="Time" value={inquiry.preferredTime} />}
            {inquiry.location && <Row label="Location" value={inquiry.location.name} />}
            {inquiry.guestCount && <Row label="Guests" value={`~${inquiry.guestCount} kids`} />}
          </div>

          {/* Contact */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: '#F8FAFC' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>Contact</p>
            <Row label="Phone" value={inquiry.phone} />
            {inquiry.email && <Row label="Email" value={inquiry.email} />}
            {inquiry.commApp && <Row label="Preferred app" value={inquiry.commApp} />}
            {inquiry.lineId && <Row label="LINE ID" value={inquiry.lineId} />}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
              Internal notes
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes}
              rows={3} placeholder="Confirmation details, special requests…"
              className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-semibold resize-none"
              style={{ borderColor: '#E2E8F0', color: '#0A1628' }} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex gap-2 flex-wrap" style={{ borderColor: '#E2E8F0' }}>
          {/* WhatsApp */}
          <a href={`https://wa.me/${waPhone(inquiry.phone)}`} target="_blank" rel="noreferrer"
            className="btn flex items-center gap-2 text-sm font-bold"
            style={{ background: '#25D366', color: '#fff' }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            WhatsApp
          </a>
          {inquiry.lineId && (
            <a href={`line://ti/p/~${inquiry.lineId}`} target="_blank" rel="noreferrer"
              className="btn flex items-center gap-2 text-sm font-bold"
              style={{ background: '#06C755', color: '#fff' }}>
              LINE
            </a>
          )}
          <div className="flex-1" />
          {inquiry.status !== 'CONFIRMED' && (
            <button onClick={() => setStatus('CONFIRMED')} disabled={saving}
              className="btn flex items-center gap-2 text-sm font-bold"
              style={{ background: '#15803D', color: '#fff' }}>
              <Check size={14} /> Confirm
            </button>
          )}
          {inquiry.status !== 'CANCELLED' && (
            <button onClick={() => setStatus('CANCELLED')} disabled={saving}
              className="btn flex items-center gap-2 text-sm font-bold"
              style={{ background: '#F1F5F9', color: '#64748B' }}>
              <X size={14} /> Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-semibold shrink-0" style={{ color: '#94A3B8' }}>{label}</span>
      <span className="text-xs font-bold text-right" style={{ color: '#0A1628' }}>{value}</span>
    </div>
  )
}

export default function BirthdayAdminPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('PENDING')
  const [selected, setSelected] = useState<Inquiry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/birthday')
      .then(r => r.json())
      .then(d => { setInquiries(d.inquiries ?? []); setLoading(false) })
  }, [])

  function handleUpdate(updated: Inquiry) {
    setInquiries(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i))
    setSelected(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev)
  }

  const filtered = filter === 'ALL' ? inquiries : inquiries.filter(i => i.status === filter)
  const pending = inquiries.filter(i => i.status === 'PENDING').length

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>Birthdays</h1>
          <p className="text-sm font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
            {inquiries.length} request{inquiries.length !== 1 ? 's' : ''} · {pending} pending
          </p>
        </div>
        <a href="/admin/birthday/slots"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
          style={{ borderColor: '#E2E8F0', color: '#475569' }}>
          <Calendar size={15} />
          Available slots
        </a>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'] as const).map(s => {
          const count = s === 'ALL' ? inquiries.length : inquiries.filter(i => i.status === s).length
          const st = s === 'ALL' ? null : STATUS_STYLES[s]
          return (
            <button key={s} onClick={() => setFilter(s)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5"
              style={filter === s
                ? { background: st?.color ?? '#0A1628', color: '#fff' }
                : { background: '#F1F5F9', color: '#64748B' }}>
              {s === 'ALL' ? 'All' : st?.label}
              <span className="text-xs px-1.5 py-0.5 rounded-full font-black"
                style={{ background: 'rgba(255,255,255,0.25)' }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="card p-10 text-center">
          <p className="font-semibold" style={{ color: '#94A3B8' }}>Loading…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-semibold" style={{ color: '#94A3B8' }}>No requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inq => {
            const s = STATUS_STYLES[inq.status]
            const dateLabel = inq.preferredDate
              ? new Date(inq.preferredDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
              : '—'
            return (
              <button key={inq.id} onClick={() => setSelected(inq)}
                className="card w-full text-left p-4 hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                    style={{ background: '#FFF7ED' }}>🎂</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm" style={{ color: '#0A1628' }}>
                        {inq.kidName}{inq.kid2Name ? ` & ${inq.kid2Name}` : ''}
                      </p>
                      {inq.isMember && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                          style={{ background: '#CCFF00', color: '#0A1628' }}>Member</span>
                      )}
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                      {inq.parentName} · {inq.phone}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-sm font-bold flex items-center gap-1" style={{ color: '#0A1628' }}>
                      <Calendar size={12} />{dateLabel}
                    </p>
                    {inq.guestCount && (
                      <p className="text-xs font-semibold flex items-center gap-1" style={{ color: '#94A3B8' }}>
                        <Users size={11} />{inq.guestCount}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <DetailModal inquiry={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />
      )}
    </div>
  )
}
