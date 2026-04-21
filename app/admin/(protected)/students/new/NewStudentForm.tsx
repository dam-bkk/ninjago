'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Camera } from 'lucide-react'

type Location = { id: number; name: string }

type SuccessInfo = {
  studentId: number
  studentName: string
  parentName: string
  parentPhone: string
  pin: string          // empty if existing parent
  isExisting: boolean
}

// WhatsApp cleans the phone — strip spaces/dashes, keep +
function waPhone(raw: string) {
  return raw.replace(/[\s\-().]/g, '')
}

function buildMessage(info: SuccessInfo, portalUrl: string) {
  const firstName = info.studentName.split(' ')[0]
  const greeting = info.parentName ? `Hi ${info.parentName}! ` : 'Hi! '
  if (info.isExisting) {
    return (
      `${greeting}🥷\n\n` +
      `Welcome! ${firstName} has just been registered at Ninja Academy!\n\n` +
      `Access the parent portal for booking:\n` +
      `🔗 ${portalUrl}/login\n\n` +
      `📱 Phone: ${info.parentPhone}\n` +
      `🔑 Use your existing PIN.\n\n` +
      `See you soon! 🤸`
    )
  }
  return (
    `${greeting}🥷\n\n` +
    `Welcome! ${firstName} has just been registered at Ninja Academy!\n\n` +
    `Access the parent portal for booking:\n` +
    `🔗 ${portalUrl}/login\n\n` +
    `📱 Phone: ${info.parentPhone}\n` +
    `🔑 PIN: ${info.pin}\n\n` +
    `See you soon! 🤸`
  )
}

function SharePanel({ info, onViewProfile }: { info: SuccessInfo; onViewProfile: () => void }) {
  const [copied, setCopied] = useState(false)
  const portalUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const message = buildMessage(info, portalUrl)

  function copyMessage() {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function openWhatsApp() {
    const phone = waPhone(info.parentPhone)
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  function openLine() {
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <div className="space-y-5">
      {/* Confirmation */}
      <div className="card p-6 text-center space-y-2"
        style={{ background: '#F0FFF4', borderColor: '#BBF7D0' }}>
        <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
          style={{ background: '#22C55E' }}>
          <Check size={24} color="white" strokeWidth={3} />
        </div>
        <p className="font-display font-semibold text-lg" style={{ color: '#0A1628' }}>
          {info.studentName} registered
        </p>
        <p className="text-sm font-semibold" style={{ color: '#15803D' }}>
          {info.isExisting ? 'Added to existing account' : 'New parent account created'}
        </p>
      </div>

      {/* Message preview */}
      <div className="card p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
          Message to send to parent
        </p>
        <pre className="text-sm font-semibold whitespace-pre-wrap rounded-xl p-4"
          style={{
            background: '#F8FAFC',
            color: '#0A1628',
            fontFamily: 'inherit',
            lineHeight: 1.6,
          }}>
          {message}
        </pre>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={copyMessage}
            className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 transition-all"
            style={{ background: copied ? '#F0FFF4' : '#F1F5F9' }}>
            {copied
              ? <Check size={20} style={{ color: '#22C55E' }} />
              : <Copy size={20} style={{ color: '#0A1628' }} />}
            <span className="text-xs font-bold" style={{ color: copied ? '#22C55E' : '#0A1628' }}>
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>

          <button onClick={openWhatsApp}
            className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 transition-all"
            style={{ background: '#F0FFF4' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span className="text-xs font-bold" style={{ color: '#15803D' }}>WhatsApp</span>
          </button>

          <button onClick={openLine}
            className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 transition-all"
            style={{ background: '#F0FFF8' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#06C755">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            <span className="text-xs font-bold" style={{ color: '#06C755' }}>LINE</span>
          </button>
        </div>
      </div>

      {/* Go to profile */}
      <button onClick={onViewProfile}
        className="btn w-full font-bold"
        style={{ background: '#0A1628', color: '#CCFF00' }}>
        View {info.studentName}'s profile →
      </button>
    </div>
  )
}

export default function NewStudentForm({ locations }: { locations: Location[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<SuccessInfo | null>(null)

  // Parent fields
  const [parentPhone, setParentPhone] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [pin, setPin] = useState('')
  const [existingParent, setExistingParent] = useState<{ id: number; name: string | null; phone: string } | null>(null)
  const [lookingUp, setLookingUp] = useState(false)

  // Student fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [studentBirthdate, setStudentBirthdate] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }
  const [locationId, setLocationId] = useState(locations[0]?.id.toString() ?? '')

  async function lookupParent() {
    const phone = parentPhone.replace(/\s+/g, '').trim()
    if (!phone) return
    setLookingUp(true)
    try {
      const res = await fetch(`/api/admin/parents/lookup?phone=${encodeURIComponent(phone)}`)
      if (res.ok) {
        const data = await res.json()
        setExistingParent(data.parent)
      } else {
        setExistingParent(null)
      }
    } finally {
      setLookingUp(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!pin && !existingParent) {
      setError('PIN is required for a new parent')
      return
    }
    if (pin && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
      setError('PIN must be exactly 4 digits')
      return
    }

    setLoading(true)
    try {
      const studentName = `${firstName.trim()} ${lastName.trim()}`.trim()
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentPhone: parentPhone.replace(/\s+/g, '').trim(),
          parentName: parentName || null,
          parentEmail: parentEmail || null,
          pin: existingParent ? undefined : pin,
          existingParentId: existingParent?.id,
          studentName,
          studentBirthdate,
          locationId: parseInt(locationId),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Unexpected error')
        return
      }
      setSuccess({
        studentId: data.studentId,
        studentName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        parentName: existingParent?.name ?? parentName,
        parentPhone: parentPhone.replace(/\s+/g, '').trim(),
        pin: existingParent ? '' : pin,
        isExisting: !!existingParent,
      })
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <SharePanel
        info={success}
        onViewProfile={() => router.push(`/admin/students/${success.studentId}`)}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Parent section */}
      <div className="card p-6 space-y-4">
        <h2 className="font-display font-semibold text-base" style={{ color: '#0A1628' }}>
          Parent / guardian
        </h2>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
            Phone number *
          </label>
          <div className="flex gap-2">
            <input
              type="tel"
              value={parentPhone}
              onChange={e => { setParentPhone(e.target.value); setExistingParent(null) }}
              onBlur={lookupParent}
              placeholder="+66 81 234 5678"
              required
              className="input flex-1"
            />
            <button type="button" onClick={lookupParent}
              className="btn btn-secondary shrink-0" disabled={lookingUp}>
              {lookingUp ? '…' : 'Lookup'}
            </button>
          </div>
          {existingParent && (
            <p className="text-xs font-bold mt-1" style={{ color: '#22C55E' }}>
              ✓ Existing parent: {existingParent.name ?? existingParent.phone} — student will be added to this account
            </p>
          )}
        </div>

        {!existingParent && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
                  Parent name
                </label>
                <input type="text" value={parentName} onChange={e => setParentName(e.target.value)}
                  placeholder="Lisa Martin" className="input" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
                  Email (optional)
                </label>
                <input type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)}
                  placeholder="lisa@email.com" className="input" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
                PIN code (4 digits) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  className="input"
                  style={{ letterSpacing: '0.4em', fontWeight: 800, fontSize: '1.1rem', maxWidth: '120px' }}
                />
                <button
                  type="button"
                  onClick={() => setPin(String(Math.floor(1000 + Math.random() * 9000)))}
                  className="btn btn-secondary shrink-0"
                >
                  Generate
                </button>
              </div>
              <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                The parent will use this PIN to log in to the portal
              </p>
            </div>
          </>
        )}
      </div>

      {/* Student section */}
      <div className="card p-6 space-y-4">
        <h2 className="font-display font-semibold text-base" style={{ color: '#0A1628' }}>
          Student
        </h2>

        <div className="flex items-start gap-4">
          {/* Photo placeholder — 33% */}
          <div style={{ width: '33%' }} className="shrink-0">
            <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
            <button type="button" onClick={() => photoRef.current?.click()}
              className="w-full aspect-square rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2 transition-all hover:opacity-80"
              style={{ background: photoPreview ? 'transparent' : '#F1F5F9', border: '2px dashed #CBD5E1' }}>
              {photoPreview
                ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                : <>
                    <Camera size={24} style={{ color: '#94A3B8' }} />
                    <span className="text-xs font-semibold" style={{ color: '#CBD5E1' }}>Photo</span>
                  </>}
            </button>
          </div>

          {/* Name fields */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
                First name *
              </label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                placeholder="Tom" required className="input" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
                Last name *
              </label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                placeholder="Martin" required className="input" />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
            Date of birth *
          </label>
          <input type="date" value={studentBirthdate} onChange={e => setStudentBirthdate(e.target.value)}
            required className="input"
            max={new Date().toISOString().split('T')[0]} />
          {studentBirthdate && (() => {
            const bd = new Date(studentBirthdate)
            const now = new Date()
            const age = now.getFullYear() - bd.getFullYear()
              - (now < new Date(now.getFullYear(), bd.getMonth(), bd.getDate()) ? 1 : 0)
            const nextBday = new Date(now.getFullYear(), bd.getMonth(), bd.getDate())
            if (nextBday < now) nextBday.setFullYear(now.getFullYear() + 1)
            const daysUntil = Math.ceil((nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            const birthdayLabel = daysUntil <= 31
              ? ` · 🎂 in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}!`
              : ''
            return (
              <p className="text-xs font-bold mt-1" style={{ color: '#0A1628' }}>
                {age} y.o.{birthdayLabel}
              </p>
            )
          })()}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
            Location *
          </label>
          <select value={locationId} onChange={e => setLocationId(e.target.value)} required className="input">
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm font-bold" style={{ color: '#DC2626' }}>{error}</p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Creating…' : 'Create student'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  )
}
