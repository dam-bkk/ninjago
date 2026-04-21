'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PackagePrice = {
  id: number; packageType: string; label: string
  price: number; credits: number; validityMonths: number
  dropInPrice: number | null; description: string | null; highlighted: boolean
}

export default function AddPackageModal({ studentId, prices }: { studentId: number; prices: PackagePrice[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedPrice, setSelectedPrice] = useState<PackagePrice | null>(null)
  const [pricePaid, setPricePaid] = useState('')
  const [method, setMethod] = useState('CASH')
  const [groupLabel, setGroupLabel] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function openModal() {
    setSelectedPrice(null)
    setPricePaid('')
    setMethod('CASH')
    setGroupLabel('')
    setNotes('')
    setError('')
    setOpen(true)
  }

  function selectPrice(p: PackagePrice) {
    setSelectedPrice(p)
    setPricePaid(p.price.toString())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPrice) { setError('Select a package'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          packagePriceId: selectedPrice.id,
          pricePaid: parseInt(pricePaid),
          method,
          groupLabel: groupLabel || null,
          notes: notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); return }
      setOpen(false)
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const grouped: Record<string, PackagePrice[]> = {}
  for (const p of prices) {
    const group = p.packageType.startsWith('DROP_IN') ? 'Drop-in'
      : p.packageType.startsWith('CLASS') ? 'Class packs'
      : p.packageType.includes('EXTENDED') ? 'Extended camp packs'
      : 'Camp packs'
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(p)
  }

  return (
    <>
      <button onClick={openModal} className="btn btn-primary">+ Add package</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b" style={{ borderColor: '#E2E8F0' }}>
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-lg" style={{ color: '#0A1628' }}>Add package</h2>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              {/* Package picker */}
              <div className="space-y-3">
                {Object.entries(grouped).map(([group, pkgs]) => (
                  <div key={group}>
                    <p className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>{group}</p>
                    <div className="space-y-2">
                      {pkgs.map(p => (
                        <button key={p.id} type="button" onClick={() => selectPrice(p)}
                          className="w-full text-left p-3 rounded-xl border-2 transition-all"
                          style={selectedPrice?.id === p.id
                            ? { borderColor: '#00C2E0', background: '#00C2E015' }
                            : { borderColor: '#E2E8F0', background: '#fff' }
                          }>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-bold text-sm" style={{ color: '#0A1628' }}>{p.label}</p>
                              <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                                {p.credits} credits · {p.validityMonths} month{p.validityMonths !== 1 ? 's' : ''}
                                {p.dropInPrice ? ` · Drop-in ฿${p.dropInPrice.toLocaleString()}/session` : ''}
                              </p>
                              {p.description && (
                                <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>{p.description}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-black text-base" style={{ color: '#0A1628' }}>฿{p.price.toLocaleString()}</p>
                              {p.dropInPrice && (
                                <p className="text-xs font-bold mt-0.5" style={{ color: '#22C55E' }}>
                                  Save ฿{(p.dropInPrice * p.credits - p.price).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedPrice && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Price paid (฿)</label>
                      <input type="number" value={pricePaid} onChange={e => setPricePaid(e.target.value)}
                        required min={0} className="input" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Payment method</label>
                      <select value={method} onChange={e => setMethod(e.target.value)} className="input">
                        <option value="CASH">Cash</option>
                        <option value="TRANSFER">Transfer</option>
                        <option value="QR_PROMPTPAY">QR PromptPay</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
                      Shared with (optional)
                    </label>
                    <input type="text" value={groupLabel} onChange={e => setGroupLabel(e.target.value)}
                      placeholder="e.g. Tom + Lisa" className="input" />
                    <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                      If this pack is shared between siblings/friends
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Notes</label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Optional note" className="input" />
                  </div>
                </>
              )}

              {error && <p className="text-sm font-bold" style={{ color: '#DC2626' }}>{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading || !selectedPrice} className="btn btn-primary flex-1">
                  {loading ? 'Adding…' : 'Add package'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
