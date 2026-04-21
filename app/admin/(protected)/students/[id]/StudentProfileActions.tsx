'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Camera, KeyRound, X, Check, Loader2 } from 'lucide-react'

type Props = {
  studentId: number
  studentName: string
  birthdate: string | null   // ISO string or null
  photoUrl: string | null
  parentId: number | null
  parentName: string | null
  parentPhone: string
}

// ── Edit student modal ────────────────────────────────────────
function EditModal({ studentId, initialName, initialBirthdate, onClose, onSaved }: {
  studentId: number
  initialName: string
  initialBirthdate: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName]           = useState(initialName)
  const [birthdate, setBirthdate] = useState(initialBirthdate ?? '')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const res = await fetch(`/api/admin/students/${studentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, birthdate }),
    })
    if (!res.ok) { setError('Error saving changes'); setSaving(false); return }
    onSaved()
  }

  // Computed age preview
  const agePreview = (() => {
    if (!birthdate) return null
    const bd = new Date(birthdate)
    const now = new Date()
    const age = now.getFullYear() - bd.getFullYear()
      - (now < new Date(now.getFullYear(), bd.getMonth(), bd.getDate()) ? 1 : 0)
    return age
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
          <p className="font-display font-semibold" style={{ color: '#0A1628' }}>Edit profile</p>
          <button onClick={onClose}><X size={18} style={{ color: '#94A3B8' }} /></button>
        </div>
        <form onSubmit={save} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Full name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="input w-full" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Date of birth</label>
            <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} className="input w-full"
              max={new Date().toISOString().split('T')[0]} />
            {agePreview !== null && (
              <p className="text-xs font-bold" style={{ color: '#0A1628' }}>{agePreview} y.o.</p>
            )}
          </div>
          {error && <p className="text-xs font-bold" style={{ color: '#EF4444' }}>{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn flex-1 font-bold"
              style={{ background: '#0A1628', color: '#CCFF00' }}>
              {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Reset PIN modal ───────────────────────────────────────────
function ResetPinModal({ parentId, parentName, onClose }: {
  parentId: number
  parentName: string | null
  onClose: () => void
}) {
  const [pin, setPin]     = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone]   = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{4}$/.test(pin)) return
    setSaving(true)
    await fetch(`/api/admin/parents/${parentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    setDone(true)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
          <p className="font-display font-semibold" style={{ color: '#0A1628' }}>Reset PIN</p>
          <button onClick={onClose}><X size={18} style={{ color: '#94A3B8' }} /></button>
        </div>
        <div className="p-5">
          {done ? (
            <div className="text-center space-y-3 py-2">
              <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center" style={{ background: '#22C55E' }}>
                <Check size={22} color="white" strokeWidth={3} />
              </div>
              <p className="font-bold" style={{ color: '#0A1628' }}>PIN updated</p>
              <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>
                New PIN for {parentName ?? 'this parent'}: <span className="font-black" style={{ color: '#0A1628', letterSpacing: '0.2em' }}>{pin}</span>
              </p>
              <button onClick={onClose} className="btn btn-secondary w-full mt-2">Close</button>
            </div>
          ) : (
            <form onSubmit={save} className="space-y-4">
              <p className="text-sm font-semibold" style={{ color: '#64748B' }}>
                New PIN for {parentName ?? 'this parent'}
              </p>
              <div className="flex items-center gap-2">
                <input type="text" inputMode="numeric" maxLength={4}
                  value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234" className="input"
                  style={{ letterSpacing: '0.4em', fontWeight: 800, fontSize: '1.2rem', maxWidth: '120px' }} />
                <button type="button" onClick={() => setPin(String(Math.floor(1000 + Math.random() * 9000)))}
                  className="btn btn-secondary text-xs">Generate</button>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving || pin.length !== 4}
                  className="btn flex-1 font-bold" style={{ background: '#0A1628', color: '#CCFF00' }}>
                  {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────
export default function StudentProfileActions(props: Props) {
  const router = useRouter()
  const [showEdit, setShowEdit]         = useState(false)
  const [showResetPin, setShowResetPin] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(props.photoUrl)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Local preview
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    // Upload
    setUploadingPhoto(true)
    const fd = new FormData()
    fd.append('photo', file)
    await fetch(`/api/admin/students/${props.studentId}/photo`, { method: 'POST', body: fd })
    setUploadingPhoto(false)
  }

  const initials = props.studentName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      {/* Avatar with camera button */}
      <div className="relative w-14 h-14 shrink-0">
        <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center font-black text-lg"
          style={{ background: photoPreview ? 'transparent' : '#0A1628', color: '#CCFF00' }}>
          {photoPreview
            ? <img src={photoPreview} alt={props.studentName} className="w-full h-full object-cover" />
            : initials}
        </div>
        <button onClick={() => photoRef.current?.click()}
          disabled={uploadingPhoto}
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all"
          style={{ background: '#0A1628', color: '#CCFF00' }}>
          {uploadingPhoto
            ? <Loader2 size={10} className="animate-spin" />
            : <Camera size={10} />}
        </button>
        <input ref={photoRef} type="file" accept="image/*" capture="environment"
          className="hidden" onChange={handlePhotoChange} />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 ml-auto flex-wrap">
        <button onClick={() => setShowEdit(true)}
          className="btn btn-secondary flex items-center gap-1.5 text-xs font-bold">
          <Pencil size={13} /> Edit
        </button>
        {props.parentId && (
          <button onClick={() => setShowResetPin(true)}
            className="btn btn-secondary flex items-center gap-1.5 text-xs font-bold">
            <KeyRound size={13} /> Reset PIN
          </button>
        )}
      </div>

      {showEdit && (
        <EditModal
          studentId={props.studentId}
          initialName={props.studentName}
          initialBirthdate={props.birthdate ? props.birthdate.split('T')[0] : null}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); router.refresh() }}
        />
      )}
      {showResetPin && props.parentId && (
        <ResetPinModal
          parentId={props.parentId}
          parentName={props.parentName}
          onClose={() => setShowResetPin(false)}
        />
      )}
    </>
  )
}
