'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Camera, KeyRound, Trash2, X, Check, Loader2, Copy } from 'lucide-react'

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
function ResetPinModal({ parentId, parentName, parentPhone, onClose }: {
  parentId: number
  parentName: string | null
  parentPhone: string
  onClose: () => void
}) {
  const [pin, setPin]       = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)
  const [copied, setCopied] = useState(false)

  const portalUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const message =
    `Hi ${parentName ?? 'there'}! 🥷\n\n` +
    `Here is your new PIN for Ninja Academy:\n\n` +
    `📱 Phone: ${parentPhone}\n` +
    `🔑 PIN: ${pin}\n\n` +
    `Access the parent portal here:\n` +
    `🔗 ${portalUrl}/login\n\n` +
    `Keep it handy — you'll need it every time you log in to book sessions or check your credits.\n\n` +
    `See you soon! 🤸`

  function waPhone(raw: string) {
    return raw.replace(/[\s\-().]/g, '')
  }

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

  function copyMessage() {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function openWhatsApp() {
    window.open(`https://wa.me/${waPhone(parentPhone)}?text=${encodeURIComponent(message)}`, '_blank')
  }

  function openLine() {
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(message)}`, '_blank')
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
            <div className="space-y-4">
              {/* Success header */}
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F0FFF4', border: '1px solid #BBF7D0' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#22C55E' }}>
                  <Check size={18} color="white" strokeWidth={3} />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#15803D' }}>PIN updated</p>
                  <p className="text-xs font-semibold" style={{ color: '#166534' }}>
                    New PIN: <span style={{ letterSpacing: '0.25em', fontWeight: 900 }}>{pin}</span>
                  </p>
                </div>
              </div>

              {/* Message preview */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Message to send</p>
                <pre className="text-xs font-semibold leading-relaxed whitespace-pre-wrap rounded-xl p-3"
                  style={{ background: '#F8FAFC', color: '#334155', fontFamily: 'inherit', border: '1px solid #E2E8F0' }}>
                  {message}
                </pre>
              </div>

              {/* Share buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={copyMessage}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all"
                  style={{ background: '#F1F5F9', color: '#475569' }}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={openWhatsApp}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all"
                  style={{ background: '#DCFCE7', color: '#15803D' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </button>
                <button onClick={openLine}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all"
                  style={{ background: '#DCFCE7', color: '#15803D' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                  </svg>
                  LINE
                </button>
              </div>

              <button onClick={onClose} className="btn btn-secondary w-full">Done</button>
            </div>
          ) : (
            <form onSubmit={save} className="space-y-4">
              <p className="text-sm font-semibold" style={{ color: '#64748B' }}>
                New PIN for <span className="font-bold" style={{ color: '#0A1628' }}>{parentName ?? 'this parent'}</span>
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

// ── Delete modal ──────────────────────────────────────────────
function DeleteModal({ studentId, studentName, onClose }: {
  studentId: number
  studentName: string
  onClose: () => void
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError]       = useState('')

  async function confirm() {
    setDeleting(true)
    const res = await fetch(`/api/admin/students/${studentId}`, { method: 'DELETE' })
    if (!res.ok) {
      setError('Failed to delete student')
      setDeleting(false)
      return
    }
    router.push('/admin/students')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
          <p className="font-display font-semibold" style={{ color: '#DC2626' }}>Delete student</p>
          <button onClick={onClose}><X size={18} style={{ color: '#94A3B8' }} /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm font-semibold" style={{ color: '#64748B' }}>
            This will permanently delete <span className="font-black" style={{ color: '#0A1628' }}>{studentName}</span> and all their attendance, reservations, and package history. This cannot be undone.
          </p>
          {error && <p className="text-xs font-bold" style={{ color: '#EF4444' }}>{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button onClick={confirm} disabled={deleting}
              className="btn flex-1 font-bold"
              style={{ background: '#DC2626', color: '#fff' }}>
              {deleting ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Delete'}
            </button>
          </div>
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
  const [showDelete, setShowDelete]     = useState(false)
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
        <button onClick={() => setShowDelete(true)}
          className="btn flex items-center gap-1.5 text-xs font-bold"
          style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
          <Trash2 size={13} /> Delete
        </button>
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
          parentPhone={props.parentPhone}
          onClose={() => setShowResetPin(false)}
        />
      )}
      {showDelete && (
        <DeleteModal
          studentId={props.studentId}
          studentName={props.studentName}
          onClose={() => setShowDelete(false)}
        />
      )}
    </>
  )
}
