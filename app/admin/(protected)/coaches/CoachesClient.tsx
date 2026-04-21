'use client'

import { useState } from 'react'
import { Plus, Pencil, ToggleLeft, ToggleRight, X, ShieldCheck, Sword, User, QrCode, Printer } from 'lucide-react'
import QRCode from 'react-qr-code'

type Location = { id: number; name: string; qrToken?: string }
type Coach = {
  id: number
  name: string
  email: string
  phone: string | null
  role: string
  locationId: number | null
  active: boolean
  location: { id: number; name: string } | null
}

const ROLES = [
  { value: 'COACH',       label: 'Coach',       Icon: Sword },
  { value: 'ADMIN',       label: 'Admin',        Icon: User },
  { value: 'SUPER_ADMIN', label: 'Super Admin',  Icon: ShieldCheck },
]

function roleBadge(role: string) {
  if (role === 'SUPER_ADMIN') return { bg: '#FEF3C7', color: '#D97706', label: 'Super Admin' }
  if (role === 'ADMIN')       return { bg: '#EFF6FF', color: '#2563EB', label: 'Admin' }
  return                             { bg: '#F1F5F9', color: '#475569', label: 'Coach' }
}

type Form = {
  name: string; email: string; phone: string
  role: string; locationId: string; password: string; active: boolean
}

const BLANK: Form = { name: '', email: '', phone: '', role: 'COACH', locationId: '', password: '', active: true }

export default function CoachesClient({
  initialCoaches, locations,
}: {
  initialCoaches: Coach[]
  locations: Location[]
}) {
  const [coaches, setCoaches] = useState<Coach[]>(initialCoaches)
  const [qrLocation, setQrLocation] = useState<Location | null>(null)
  const [modal, setModal] = useState<false | 'add' | Coach>(false)
  const [form, setForm] = useState<Form>(BLANK)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function openAdd() {
    setForm(BLANK)
    setError('')
    setModal('add')
  }

  function openEdit(c: Coach) {
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone ?? '',
      role: c.role,
      locationId: c.locationId?.toString() ?? '',
      password: '',
      active: c.active,
    })
    setError('')
    setModal(c)
  }

  const isEditing = typeof modal !== 'string'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        role: form.role,
        locationId: form.locationId || null,
        ...(form.password ? { password: form.password } : {}),
        ...(!isEditing ? { password: form.password } : {}),
        active: form.active,
      }

      let res: Response
      if (isEditing) {
        res = await fetch(`/api/admin/coaches/${(modal as Coach).id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/admin/coaches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); return }

      if (isEditing) {
        setCoaches(cs => cs.map(c => c.id === data.coach.id ? data.coach : c))
      } else {
        setCoaches(cs => [...cs, data.coach])
      }
      setModal(false)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(c: Coach) {
    const res = await fetch(`/api/admin/coaches/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !c.active }),
    })
    if (res.ok) {
      const data = await res.json()
      setCoaches(cs => cs.map(x => x.id === c.id ? data.coach : x))
    }
  }

  const grouped = {
    SUPER_ADMIN: coaches.filter(c => c.role === 'SUPER_ADMIN'),
    ADMIN:       coaches.filter(c => c.role === 'ADMIN'),
    COACH:       coaches.filter(c => c.role === 'COACH'),
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>Staff & Coaches</h1>
          <p className="text-sm font-semibold mt-0.5" style={{ color: '#94A3B8' }}>{coaches.length} member{coaches.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> Add
        </button>
      </div>

      {(['SUPER_ADMIN', 'ADMIN', 'COACH'] as const).map(role => {
        const list = grouped[role]
        if (!list.length) return null
        const badge = roleBadge(role)
        return (
          <div key={role}>
            <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>
              {badge.label}s ({list.length})
            </p>
            <div className="space-y-2">
              {list.map(c => (
                <div key={c.id} className="card flex items-center gap-4 px-5 py-4"
                  style={{ opacity: c.active ? 1 : 0.5 }}>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0"
                    style={{ background: badge.bg, color: badge.color }}>
                    {c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: '#0A1628' }}>{c.name}</p>
                    <p className="text-xs font-semibold mt-0.5 truncate" style={{ color: '#94A3B8' }}>
                      {c.email}
                      {c.phone ? ` · ${c.phone}` : ''}
                      {c.location ? ` · ${c.location.name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleActive(c)} title={c.active ? 'Deactivate' : 'Activate'}
                      style={{ color: c.active ? '#22C55E' : '#CBD5E1' }}>
                      {c.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                    <button onClick={() => openEdit(c)}
                      className="btn btn-secondary p-2">
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* QR Stations */}
      {locations.some(l => l.qrToken) && (
        <div>
          <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>
            QR Stations ({locations.length})
          </p>
          <div className="space-y-2">
            {locations.map(loc => (
              <div key={loc.id} className="card flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: '#F1F5F9' }}>
                  <QrCode size={20} style={{ color: '#0A1628' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: '#0A1628' }}>{loc.name}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                    /coach/{loc.qrToken?.slice(0, 12)}…
                  </p>
                </div>
                <button onClick={() => setQrLocation(loc)}
                  className="btn btn-secondary flex items-center gap-2 shrink-0"
                  style={{ fontSize: '0.8rem' }}>
                  <Printer size={14} /> Print
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal !== false && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
              <h3 className="font-display font-semibold" style={{ color: '#0A1628' }}>
                {isEditing ? 'Edit staff member' : 'Add staff member'}
              </h3>
              <button onClick={() => setModal(false)}><X size={20} style={{ color: '#94A3B8' }} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required className="input" placeholder="Full name" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required className="input" placeholder="coach@ninja.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="input" placeholder="+66 8x xxx xxxx" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input">
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Location</label>
                  <select value={form.locationId} onChange={e => setForm(f => ({ ...f, locationId: e.target.value }))} className="input">
                    <option value="">All locations</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
                    {isEditing ? 'New password (leave blank to keep)' : 'Password'}
                  </label>
                  <input type="password" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required={!isEditing}
                    className="input" placeholder={isEditing ? 'Leave blank to keep current' : 'Min 8 chars'} />
                </div>
              </div>

              {isEditing && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm font-bold" style={{ color: '#0A1628' }}>Active</span>
                </label>
              )}

              {error && <p className="text-sm font-bold" style={{ color: '#DC2626' }}>{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                  {loading ? 'Saving…' : isEditing ? 'Save changes' : 'Create'}
                </button>
                <button type="button" onClick={() => setModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Print modal */}
      {qrLocation && qrLocation.qrToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
              <h3 className="font-display font-semibold" style={{ color: '#0A1628' }}>QR — {qrLocation.name}</h3>
              <button onClick={() => setQrLocation(null)}><X size={20} style={{ color: '#94A3B8' }} /></button>
            </div>
            <div className="p-6 space-y-5" id="qr-print-area">
              {/* Printable card */}
              <div className="rounded-2xl p-6 text-center space-y-4 border-2" style={{ borderColor: '#E2E8F0' }}>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#0A1628' }}>
                    <span style={{ fontSize: '0.85rem' }}>🥷</span>
                  </div>
                  <span className="font-display font-semibold" style={{ color: '#0A1628' }}>Ninja Academy</span>
                </div>
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-xl border" style={{ borderColor: '#E2E8F0' }}>
                    <QRCode
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/coach/${qrLocation.qrToken}`}
                      size={180}
                      fgColor="#0A1628"
                    />
                  </div>
                </div>
                <div>
                  <p className="font-display font-bold text-lg" style={{ color: '#0A1628' }}>{qrLocation.name}</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#94A3B8' }}>
                    Scan to access today's coach view
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="btn btn-primary w-full flex items-center justify-center gap-2">
                <Printer size={16} /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
