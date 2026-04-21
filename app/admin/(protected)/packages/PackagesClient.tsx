'use client'

import { useState } from 'react'
import { Plus, X, Star, ToggleLeft, ToggleRight, Pencil, Trash2, ChevronDown } from 'lucide-react'

type PackagePrice = {
  id: number
  packageType: string
  label: string
  price: number
  credits: number
  validityMonths: number
  dropInPrice: number | null
  description: string | null
  highlighted: boolean
  active: boolean
}

const PACKAGE_TYPES = [
  { value: 'CLASS_10',              label: 'Class × 10',          creditType: 'CLASS' },
  { value: 'CLASS_20',              label: 'Class × 20',          creditType: 'CLASS' },
  { value: 'CAMP_REGULAR_10',       label: 'Camp Regular × 10',   creditType: 'CAMP' },
  { value: 'CAMP_REGULAR_20',       label: 'Camp Regular × 20',   creditType: 'CAMP' },
  { value: 'CAMP_EXTENDED_10',      label: 'Camp Extended × 10',  creditType: 'CAMP_EXTENDED' },
  { value: 'CAMP_EXTENDED_20',      label: 'Camp Extended × 20',  creditType: 'CAMP_EXTENDED' },
  { value: 'DROP_IN_CLASS',         label: 'Drop-in Class',        creditType: 'CLASS' },
  { value: 'DROP_IN_CAMP',          label: 'Drop-in Camp',         creditType: 'CAMP' },
  { value: 'DROP_IN_CAMP_EXTENDED', label: 'Drop-in Ext. Camp',   creditType: 'CAMP_EXTENDED' },
]

function creditColor(t: string) {
  if (t === 'CLASS')          return '#00C2E0'
  if (t === 'CAMP')           return '#CCFF00'
  if (t === 'CAMP_EXTENDED')  return '#FFB400'
  return '#94A3B8'
}
function creditLabel(t: string) {
  if (t === 'CLASS')          return 'Class'
  if (t === 'CAMP')           return 'Camp'
  if (t === 'CAMP_EXTENDED')  return 'Camp Extended'
  return t
}
function getCreditType(packageType: string) {
  return PACKAGE_TYPES.find(p => p.value === packageType)?.creditType ?? 'CLASS'
}

function savings(pkg: PackagePrice) {
  if (!pkg.dropInPrice) return null
  return pkg.dropInPrice * pkg.credits - pkg.price
}

// ── Modal ─────────────────────────────────────────────────────
function PackageModal({
  initial, onClose, onSave,
}: {
  initial: PackagePrice | null
  onClose: () => void
  onSave: (pkg: PackagePrice) => void
}) {
  const isNew = !initial
  const [form, setForm] = useState({
    packageType:    initial?.packageType    ?? 'CLASS_10',
    label:          initial?.label          ?? '',
    price:          initial?.price          ?? '',
    credits:        initial?.credits        ?? '',
    validityMonths: initial?.validityMonths ?? '',
    dropInPrice:    initial?.dropInPrice    ?? '',
    description:    initial?.description    ?? '',
    highlighted:    initial?.highlighted    ?? false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const url = isNew ? '/api/admin/package-prices' : `/api/admin/package-prices/${initial!.id}`
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { setError('Save failed'); setLoading(false); return }
      const data = await res.json()
      onSave(data.price)
    } catch { setError('Network error'); setLoading(false) }
  }

  const ct = getCreditType(form.packageType)
  const color = creditColor(ct)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
          <p className="font-display font-semibold text-base" style={{ color: '#0A1628' }}>
            {isNew ? 'New Package' : 'Edit Package'}
          </p>
          <button onClick={onClose}><X size={20} style={{ color: '#94A3B8' }} /></button>
        </div>

        <form onSubmit={submit} className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Package type */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#64748B' }}>Package type</label>
            <div className="relative">
              <select value={form.packageType} onChange={e => set('packageType', e.target.value)}
                className="w-full rounded-xl border px-3 py-2.5 text-sm font-semibold appearance-none pr-8"
                style={{ borderColor: '#E2E8F0', color: '#0A1628' }}>
                {PACKAGE_TYPES.map(pt => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-xs font-semibold" style={{ color }}>{creditLabel(ct)}</span>
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#64748B' }}>Display name</label>
            <input value={form.label} onChange={e => set('label', e.target.value)} required
              placeholder="e.g. Class Pack 10"
              className="w-full rounded-xl border px-3 py-2.5 text-sm font-semibold"
              style={{ borderColor: '#E2E8F0', color: '#0A1628' }} />
          </div>

          {/* Price + Credits in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#64748B' }}>Price (฿)</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} required min={0}
                className="w-full rounded-xl border px-3 py-2.5 text-sm font-semibold"
                style={{ borderColor: '#E2E8F0', color: '#0A1628' }} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#64748B' }}>Credits</label>
              <input type="number" value={form.credits} onChange={e => set('credits', e.target.value)} required min={1}
                className="w-full rounded-xl border px-3 py-2.5 text-sm font-semibold"
                style={{ borderColor: '#E2E8F0', color: '#0A1628' }} />
            </div>
          </div>

          {/* Validity + Drop-in price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#64748B' }}>Validity (months)</label>
              <input type="number" value={form.validityMonths} onChange={e => set('validityMonths', e.target.value)} required min={1}
                className="w-full rounded-xl border px-3 py-2.5 text-sm font-semibold"
                style={{ borderColor: '#E2E8F0', color: '#0A1628' }} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#64748B' }}>Drop-in price (฿)</label>
              <input type="number" value={form.dropInPrice} onChange={e => set('dropInPrice', e.target.value)} min={0}
                placeholder="optional"
                className="w-full rounded-xl border px-3 py-2.5 text-sm font-semibold"
                style={{ borderColor: '#E2E8F0', color: '#0A1628' }} />
            </div>
          </div>

          {/* Savings preview */}
          {form.price && form.credits && form.dropInPrice && (
            <div className="rounded-xl px-3 py-2.5 flex items-center justify-between"
              style={{ background: '#F0FFF4', border: '1px solid #BBF7D0' }}>
              <span className="text-xs font-semibold" style={{ color: '#15803D' }}>Savings vs drop-in</span>
              <span className="text-sm font-black" style={{ color: '#15803D' }}>
                ฿{(Number(form.dropInPrice) * Number(form.credits) - Number(form.price)).toLocaleString()}
              </span>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#64748B' }}>Description (optional)</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              placeholder="Short note shown on the portal"
              className="w-full rounded-xl border px-3 py-2.5 text-sm font-semibold resize-none"
              style={{ borderColor: '#E2E8F0', color: '#0A1628' }} />
          </div>

          {/* Highlighted toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" onClick={() => set('highlighted', !form.highlighted)}>
              {form.highlighted
                ? <ToggleRight size={28} style={{ color: '#CCFF00' }} />
                : <ToggleLeft size={28} style={{ color: '#CBD5E1' }} />}
            </button>
            <div>
              <p className="text-sm font-bold" style={{ color: '#0A1628' }}>Highlighted</p>
              <p className="text-xs" style={{ color: '#94A3B8' }}>Shows as recommended on the portal</p>
            </div>
          </label>

          {error && <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>{error}</p>}
        </form>

        <div className="p-5 border-t flex gap-3" style={{ borderColor: '#E2E8F0' }}>
          <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
          <button onClick={submit as unknown as React.MouseEventHandler} disabled={loading}
            className="btn flex-1 font-bold"
            style={{ background: '#0A1628', color: '#CCFF00' }}>
            {loading ? 'Saving…' : isNew ? 'Create' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function PackagesClient({ initialPrices }: { initialPrices: PackagePrice[] }) {
  const [prices, setPrices]   = useState<PackagePrice[]>(initialPrices)
  const [modal, setModal]     = useState<'new' | PackagePrice | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  function handleSave(pkg: PackagePrice) {
    setPrices(prev => {
      const idx = prev.findIndex(p => p.id === pkg.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = pkg; return next }
      return [...prev, pkg]
    })
    setModal(null)
  }

  async function toggleActive(pkg: PackagePrice) {
    const res = await fetch(`/api/admin/package-prices/${pkg.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !pkg.active }),
    })
    if (res.ok) {
      const { price } = await res.json()
      setPrices(prev => prev.map(p => p.id === price.id ? price : p))
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this package? This cannot be undone.')) return
    setDeleting(id)
    await fetch(`/api/admin/package-prices/${id}`, { method: 'DELETE' })
    setPrices(prev => prev.filter(p => p.id !== id))
    setDeleting(null)
  }

  // Group by credit type
  const groups: Record<string, PackagePrice[]> = {}
  for (const p of prices) {
    const ct = getCreditType(p.packageType)
    if (!groups[ct]) groups[ct] = []
    groups[ct].push(p)
  }
  const ORDER = ['CLASS', 'CAMP', 'CAMP_EXTENDED']

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>Packages</h1>
          <p className="text-sm font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
            {prices.filter(p => p.active).length} active · {prices.length} total
          </p>
        </div>
        <button onClick={() => setModal('new')}
          className="btn flex items-center gap-2 font-bold"
          style={{ background: '#0A1628', color: '#CCFF00' }}>
          <Plus size={16} /> New Package
        </button>
      </div>

      {ORDER.map(ct => {
        const group = groups[ct]
        if (!group?.length) return null
        const color = creditColor(ct)
        return (
          <div key={ct}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>
                {creditLabel(ct)}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.map(pkg => {
                const sv = savings(pkg)
                return (
                  <div key={pkg.id} className="card p-5 flex flex-col gap-3 relative"
                    style={{
                      borderTop: `3px solid ${pkg.highlighted ? color : 'transparent'}`,
                      opacity: pkg.active ? 1 : 0.5,
                    }}>

                    {/* Highlighted star */}
                    {pkg.highlighted && (
                      <div className="absolute top-4 right-4">
                        <Star size={14} fill={color} style={{ color }} />
                      </div>
                    )}

                    {/* Header */}
                    <div>
                      <p className="font-display font-semibold text-base leading-tight pr-5" style={{ color: '#0A1628' }}>
                        {pkg.label}
                      </p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                        {PACKAGE_TYPES.find(pt => pt.value === pkg.packageType)?.label ?? pkg.packageType}
                      </p>
                    </div>

                    {/* Price */}
                    <div>
                      <p className="font-black text-2xl leading-none" style={{ color: '#0A1628' }}>
                        ฿{pkg.price.toLocaleString()}
                      </p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                        {pkg.credits} credits · {pkg.validityMonths}mo validity
                      </p>
                      {pkg.dropInPrice && (
                        <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                          Drop-in: ฿{pkg.dropInPrice.toLocaleString()}/session
                        </p>
                      )}
                    </div>

                    {/* Savings */}
                    {sv && sv > 0 && (
                      <div className="rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5 self-start"
                        style={{ background: '#F0FFF4', border: '1px solid #BBF7D0' }}>
                        <span className="text-xs font-black" style={{ color: '#15803D' }}>
                          Save ฿{sv.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    {pkg.description && (
                      <p className="text-xs" style={{ color: '#64748B' }}>{pkg.description}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 border-t mt-auto" style={{ borderColor: '#F1F5F9' }}>
                      <button onClick={() => toggleActive(pkg)}
                        className="flex items-center gap-1.5 text-xs font-bold transition-colors"
                        style={{ color: pkg.active ? '#22C55E' : '#94A3B8' }}>
                        {pkg.active
                          ? <ToggleRight size={18} />
                          : <ToggleLeft size={18} />}
                        {pkg.active ? 'Active' : 'Inactive'}
                      </button>
                      <div className="flex-1" />
                      <button onClick={() => setModal(pkg)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-slate-100">
                        <Pencil size={14} style={{ color: '#64748B' }} />
                      </button>
                      <button onClick={() => handleDelete(pkg.id)} disabled={deleting === pkg.id}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50">
                        <Trash2 size={14} style={{ color: '#EF4444' }} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {prices.length === 0 && (
        <div className="card p-16 text-center">
          <p className="font-semibold" style={{ color: '#94A3B8' }}>No packages yet</p>
          <p className="text-sm mt-1" style={{ color: '#CBD5E1' }}>Click "New Package" to add your first one</p>
        </div>
      )}

      {modal && (
        <PackageModal
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
