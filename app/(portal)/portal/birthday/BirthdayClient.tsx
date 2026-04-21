'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLang, t } from '@/lib/lang-context'

type Props = {
  parentName: string
  phone: string
}

type KidForm = {
  kidName: string
  kidGender: string
  kidAge: string
  favSuperhero: string
  favColor: string
}

type AvailableSlot = {
  id: number
  date: string
  startTime: string
  endTime: string
  location: { id: number; name: string } | null
}

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS_EN = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const DAYS_TH = ['จ','อ','พ','พฤ','ศ','ส','อา']
const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

function toDateStr(d: Date | string) {
  const date = d instanceof Date ? d : new Date(d)
  return date.toISOString().split('T')[0]
}

const emptyKid = (): KidForm => ({ kidName: '', kidGender: '', kidAge: '', favSuperhero: '', favColor: '' })

export default function BirthdayClient({ parentName, phone }: Props) {
  const router = useRouter()
  const { lang } = useLang()
  const d = t(lang)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showSecondKid, setShowSecondKid] = useState(false)

  const [commApp, setCommApp] = useState('')
  const [lineId, setLineId] = useState('')
  const [kid1, setKid1] = useState<KidForm>(emptyKid())
  const [kid2, setKid2] = useState<KidForm>(emptyKid())
  const [guestCount, setGuestCount] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [notes, setNotes] = useState('')

  // Available slots from admin
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[] | null>(null)
  const [slotCalMonth, setSlotCalMonth] = useState(new Date().getMonth())
  const [slotCalYear, setSlotCalYear]   = useState(new Date().getFullYear())

  useEffect(() => {
    if (showForm && availableSlots === null) {
      fetch('/api/portal/birthday-slots')
        .then(r => r.json())
        .then(data => setAvailableSlots(data.slots ?? []))
        .catch(() => setAvailableSlots([]))
    }
  }, [showForm, availableSlots])

  const months = lang === 'th' ? MONTHS_TH : lang === 'fr' ? MONTHS_FR : MONTHS_EN
  const days   = lang === 'th' ? DAYS_TH   : lang === 'fr' ? DAYS_FR   : DAYS_EN

  // Dates with available slots
  const availableDateSet = new Set((availableSlots ?? []).map(s => toDateStr(s.date)))
  const slotsForSelectedDate = availableSlots?.filter(s => toDateStr(s.date) === preferredDate) ?? []

  function setK1(field: keyof KidForm, value: string) {
    setKid1(f => ({ ...f, [field]: value }))
  }
  function setK2(field: keyof KidForm, value: string) {
    setKid2(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/portal/birthday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentName,
          phone,
          commApp: commApp || null,
          lineId: commApp === 'LINE' ? lineId || null : null,
          kidName: kid1.kidName,
          kidGender: kid1.kidGender || null,
          kidAge: parseInt(kid1.kidAge) || null,
          favSuperhero: kid1.favSuperhero || null,
          favColor: kid1.favColor || null,
          kid2Name: showSecondKid ? kid2.kidName || null : null,
          kid2Gender: showSecondKid ? kid2.kidGender || null : null,
          kid2Age: showSecondKid ? parseInt(kid2.kidAge) || null : null,
          guestCount: parseInt(guestCount) || null,
          preferredDate: preferredDate || null,
          preferredTime: preferredTime || null,
          location: 'Sathorn',
          notes: notes || null,
          isMember: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); return }
      setDone(true)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-5 pt-16 text-center space-y-5">
        <div className="text-6xl">🎉</div>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
          style={{ background: 'linear-gradient(135deg, #CCFF00, #00C2E0)' }}>
          <CheckCircle size={38} style={{ color: '#0A1628' }} />
        </div>
        <div>
          <p className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>{d.requestSent}</p>
          <p className="text-sm font-semibold mt-2" style={{ color: 'rgba(10,22,40,0.55)' }}>
            {d.contactIn24h(commApp || 'WhatsApp/LINE')}
          </p>
        </div>
        <button onClick={() => router.push('/portal')} className="btn-ninja font-display">
          {d.backToHome}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-8 space-y-5 pb-4">

      {/* Hero */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0A1628 0%, #1e1145 50%, #0A1628 100%)', border: '1px solid rgba(255,255,255,0.10)' }}>

        {/* Festive banner */}
        <div className="px-6 pt-6 pb-4 text-center space-y-1">
          <div className="text-4xl mb-2">🎂🥷🎈</div>
          <p className="font-display font-semibold text-white" style={{ fontSize: '1.6rem', lineHeight: 1.15 }}>
            {d.birthdayParty}
          </p>
          <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Ninja Academy Thailand · Sathorn
          </p>
        </div>

        {/* Highlight strip */}
        <div className="mx-6 mb-4 rounded-2xl px-4 py-3 text-center font-display font-semibold"
          style={{ background: 'linear-gradient(90deg, #CCFF00, #a8e000)', color: '#0A1628', fontSize: '0.95rem' }}>
          500 THB / child · 2h30 of ninja fun
        </div>

        {/* Pills row */}
        <div className="flex gap-2 px-6 pb-5 flex-wrap">
          {[
            { emoji: '👥', text: '10 – 50 kids' },
            { emoji: '🕐', text: '15:00 – 17:30' },
            { emoji: '📍', text: 'Sathorn' },
          ].map(({ emoji, text }) => (
            <div key={text} className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontSize: '0.75rem' }}>{emoji}</span>
              <span className="text-xs font-bold text-white">{text}</span>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-4 rounded-2xl font-display font-semibold text-base transition-all active:scale-98"
              style={{ background: 'linear-gradient(90deg, #CCFF00, #a8e000)', color: '#0A1628', fontSize: '1rem', fontWeight: 700 }}>
              {d.bookYourDate}
            </button>
          ) : (
            <p className="text-xs font-semibold text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {d.fillFormBelow}
            </p>
          )}
        </div>
      </div>

      {/* What's included */}
      <div className="portal-card p-5 space-y-3">
        <p className="font-display font-semibold text-sm flex items-center gap-2" style={{ color: '#0A1628' }}>
          <span>🎁</span> What's included
        </p>
        <div className="space-y-2">
          {[
            'Venue (Ninja School Sathorn)',
            'Team of coaches to lead games, training & fun activities',
            'Tables and chairs for up to 50 people',
            'Access to indoor & outdoor kitchens (deep frying, BBQ, stone oven, or smoke must be done outdoors)',
            'Large fridge for birthday cake storage',
            'Birthday decorations: balloons & banners',
          ].map(item => (
            <div key={item} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: '#CCFF00' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#0A1628' }}>✓</span>
              </div>
              <p className="text-sm font-semibold" style={{ color: '#0A1628' }}>{item}</p>
            </div>
          ))}
        </div>
        <p className="text-xs font-semibold pt-1" style={{ color: 'rgba(10,22,40,0.40)' }}>
          Parents bring: food, drinks, cake · Disposable plates, cutlery, and drinking cups
        </p>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Section label */}
          <p className="font-display font-semibold text-base" style={{ color: '#0A1628' }}>
            Your request
          </p>

          {/* Parent info */}
          <Section emoji="👩" title="Your details">
            <ReadOnlyField label="Name" value={parentName} />
            <ReadOnlyField label="Phone" value={phone} />
            <Field label="Preferred app to reach you *">
              <div className="flex gap-4 pt-0.5">
                {['WhatsApp', 'LINE'].map(app => (
                  <label key={app} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="commApp" value={app} required
                      checked={commApp === app} onChange={() => setCommApp(app)} />
                    <span className="text-sm font-bold" style={{ color: '#0A1628' }}>{app}</span>
                  </label>
                ))}
              </div>
              {commApp === 'LINE' && (
                <input className="input-dark-portal mt-2" placeholder="Your LINE ID" required
                  value={lineId} onChange={e => setLineId(e.target.value)} />
              )}
            </Field>
          </Section>

          {/* Birthday kid 1 */}
          <Section emoji="🥷" title="The birthday kid">
            <Field label="Kid's name *">
              <input className="input-dark-portal" placeholder="Tom" required
                value={kid1.kidName} onChange={e => setK1('kidName', e.target.value)} />
            </Field>
            <Field label="Girl or Boy *">
              <div className="flex gap-4 pt-0.5">
                {['Girl', 'Boy'].map(g => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="kidGender" value={g} required
                      checked={kid1.kidGender === g} onChange={() => setK1('kidGender', g)} />
                    <span className="text-sm font-bold" style={{ color: '#0A1628' }}>{g}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Age to be celebrated *">
              <input className="input-dark-portal" placeholder="8" type="number" min={3} max={18} required
                value={kid1.kidAge} onChange={e => setK1('kidAge', e.target.value)} />
            </Field>
            <Field label="Favorite superhero">
              <input className="input-dark-portal" placeholder="Spiderman, Naruto…"
                value={kid1.favSuperhero} onChange={e => setK1('favSuperhero', e.target.value)} />
            </Field>
            <Field label="Favorite color">
              <input className="input-dark-portal" placeholder="Blue, red…"
                value={kid1.favColor} onChange={e => setK1('favColor', e.target.value)} />
            </Field>
          </Section>

          {/* 2nd kid toggle */}
          {!showSecondKid ? (
            <button type="button"
              onClick={() => setShowSecondKid(true)}
              className="w-full portal-card p-4 flex items-center justify-center gap-2 transition-all active:scale-98"
              style={{ borderStyle: 'dashed' }}>
              <Plus size={15} style={{ color: '#0A1628', opacity: 0.45 }} />
              <span className="text-sm font-bold" style={{ color: '#0A1628', opacity: 0.45 }}>
                Add a 2nd birthday kid
              </span>
            </button>
          ) : (
            <Section emoji="🥷" title="2nd birthday kid">
              <div className="flex justify-end -mt-1 -mb-1">
                <button type="button" onClick={() => { setShowSecondKid(false); setKid2(emptyKid()) }}
                  className="flex items-center gap-1 text-xs font-bold"
                  style={{ color: 'rgba(10,22,40,0.35)' }}>
                  <X size={12} /> Remove
                </button>
              </div>
              <Field label="Kid's name">
                <input className="input-dark-portal" placeholder="Emma"
                  value={kid2.kidName} onChange={e => setK2('kidName', e.target.value)} />
              </Field>
              <Field label="Girl or Boy">
                <div className="flex gap-4 pt-0.5">
                  {['Girl', 'Boy'].map(g => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="kid2Gender" value={g}
                        checked={kid2.kidGender === g} onChange={() => setK2('kidGender', g)} />
                      <span className="text-sm font-bold" style={{ color: '#0A1628' }}>{g}</span>
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Age to be celebrated">
                <input className="input-dark-portal" placeholder="6" type="number" min={3} max={18}
                  value={kid2.kidAge} onChange={e => setK2('kidAge', e.target.value)} />
              </Field>
              <Field label="Favorite superhero">
                <input className="input-dark-portal" placeholder="Spiderman, Naruto…"
                  value={kid2.favSuperhero} onChange={e => setK2('favSuperhero', e.target.value)} />
              </Field>
              <Field label="Favorite color">
                <input className="input-dark-portal" placeholder="Blue, red…"
                  value={kid2.favColor} onChange={e => setK2('favColor', e.target.value)} />
              </Field>
            </Section>
          )}

          {/* Event details */}
          <Section emoji="📅" title="Date & guests">

            {/* Slot calendar */}
            {availableSlots === null ? (
              <p className="text-xs font-semibold text-center py-2" style={{ color: 'rgba(10,22,40,0.35)' }}>
                Chargement des dates…
              </p>
            ) : availableSlots.length === 0 ? (
              /* No predefined slots → plain date input */
              <Field label="Preferred date">
                <input className="input-dark-portal" type="date"
                  value={preferredDate} onChange={e => setPreferredDate(e.target.value)} />
              </Field>
            ) : (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(10,22,40,0.40)' }}>
                  Available dates
                </p>
                {/* Month nav */}
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => {
                    if (slotCalMonth === 0) { setSlotCalMonth(11); setSlotCalYear(y => y - 1) } else setSlotCalMonth(m => m - 1)
                  }} className="p-1 rounded-lg" style={{ color: '#64748B' }}>
                    <ChevronLeft size={16} />
                  </button>
                  <p className="text-xs font-bold" style={{ color: '#0A1628' }}>{months[slotCalMonth]} {slotCalYear}</p>
                  <button type="button" onClick={() => {
                    if (slotCalMonth === 11) { setSlotCalMonth(0); setSlotCalYear(y => y + 1) } else setSlotCalMonth(m => m + 1)
                  }} className="p-1 rounded-lg" style={{ color: '#64748B' }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
                {/* Grid */}
                {(() => {
                  const firstDay   = new Date(slotCalYear, slotCalMonth, 1)
                  const lastDay    = new Date(slotCalYear, slotCalMonth + 1, 0)
                  const startDow   = firstDay.getDay()
                  const offset     = startDow === 0 ? 6 : startDow - 1
                  const totalCells = Math.ceil((offset + lastDay.getDate()) / 7) * 7
                  const todayStr   = toDateStr(new Date())
                  return (
                    <>
                      <div className="grid grid-cols-7 gap-0.5 mb-1">
                        {days.map(d => <p key={d} className="text-center text-xs font-bold py-0.5" style={{ color: '#94A3B8' }}>{d}</p>)}
                      </div>
                      <div className="grid grid-cols-7 gap-0.5">
                        {Array.from({ length: totalCells }, (_, i) => {
                          const dayNum = i - offset + 1
                          if (dayNum < 1 || dayNum > lastDay.getDate()) return <div key={`e-${i}`} />
                          const dateStr  = `${slotCalYear}-${String(slotCalMonth + 1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`
                          const isAvail  = availableDateSet.has(dateStr)
                          const isPast   = dateStr < todayStr
                          const isSel    = dateStr === preferredDate
                          return (
                            <button key={dateStr} type="button"
                              disabled={!isAvail || isPast}
                              onClick={() => { setPreferredDate(dateStr); setPreferredTime('') }}
                              className="aspect-square rounded-lg flex items-center justify-center text-xs font-black transition-all"
                              style={
                                isSel    ? { background: '#0A1628', color: '#CCFF00' } :
                                isAvail && !isPast ? { background: '#CCFF00', color: '#0A1628' } :
                                { background: 'transparent', color: isPast ? '#CBD5E1' : '#94A3B8', cursor: 'default' }
                              }>
                              {dayNum}
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )
                })()}

                {/* Time slots for selected date */}
                {preferredDate && slotsForSelectedDate.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(10,22,40,0.40)' }}>
                      Available times
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {slotsForSelectedDate.map(s => (
                        <button key={s.id} type="button"
                          onClick={() => setPreferredTime(`${s.startTime}–${s.endTime}`)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                          style={preferredTime === `${s.startTime}–${s.endTime}`
                            ? { background: '#0A1628', color: '#CCFF00', borderColor: '#0A1628' }
                            : { background: '#fff', color: '#0A1628', borderColor: '#E2E8F0' }}>
                          {s.startTime} – {s.endTime}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Field label="Number of kids *">
              <input className="input-dark-portal" placeholder="10 – 50" type="number" min={10} max={50} required
                value={guestCount} onChange={e => setGuestCount(e.target.value)} />
            </Field>
          </Section>

          {/* Notes */}
          <Section emoji="💬" title="Notes">
            <Field label="Themes, allergies, special requests…">
              <textarea className="input-dark-portal" placeholder="Anything else we should know?" rows={3}
                value={notes} onChange={e => setNotes(e.target.value)} />
            </Field>
          </Section>

          {error && <p className="text-sm font-bold" style={{ color: '#DC2626' }}>{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl font-display font-semibold text-base transition-all active:scale-98"
            style={{
              background: loading ? 'rgba(10,22,40,0.20)' : 'linear-gradient(90deg, #CCFF00, #a8e000)',
              color: '#0A1628',
              fontSize: '1rem',
              fontWeight: 700,
            }}>
            {loading ? d.sending : d.sendRequest}
          </button>

          <p className="text-xs font-semibold text-center" style={{ color: 'rgba(10,22,40,0.35)' }}>
            {d.confirmIn24h}
          </p>
        </form>
      )}
    </div>
  )
}

function Section({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="portal-card p-4 space-y-3">
      <p className="font-display font-semibold text-sm flex items-center gap-1.5" style={{ color: '#0A1628' }}>
        <span>{emoji}</span> {title}
      </p>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(10,22,40,0.40)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(10,22,40,0.40)' }}>{label}</p>
      <p className="text-sm font-bold py-2.5 px-3 rounded-xl"
        style={{ background: 'rgba(10,22,40,0.06)', color: '#0A1628' }}>
        {value || <span style={{ opacity: 0.35 }}>—</span>}
      </p>
    </div>
  )
}
