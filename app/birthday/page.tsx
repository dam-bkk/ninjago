'use client'

import { useState } from 'react'
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

export default function PublicBirthdayPage() {
  const [showInfo, setShowInfo] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    kidName: '', kidGender: '', kidAge: '',
    preferredDate: '',
    parentName: '', phone: '', commApp: '', lineId: '',
    favSuperhero: '', favColor: '',
    guestCount: '', notes: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
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
          ...form,
          kidAge: parseInt(form.kidAge) || null,
          guestCount: parseInt(form.guestCount) || null,
          isMember: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); return }
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5"
        style={{ background: 'linear-gradient(160deg, #0A1628 0%, #1e1145 60%, #0A1628 100%)' }}>
        <div className="text-center space-y-5 max-w-sm">
          <div className="text-6xl">🎉</div>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'linear-gradient(135deg, #CCFF00, #a8e000)' }}>
            <CheckCircle size={40} style={{ color: '#0A1628' }} />
          </div>
          <div>
            <p className="font-display font-semibold text-white" style={{ fontSize: '1.75rem' }}>Request sent!</p>
            <p className="text-sm font-semibold mt-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              We'll contact you within 24h via {form.commApp || 'WhatsApp/LINE'} to confirm your date.
            </p>
          </div>
          <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Ninja Academy Thailand · Sathorn
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0A1628 0%, #1e1145 60%, #0A1628 100%)' }}>
      <div className="max-w-lg mx-auto px-5 py-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="text-5xl">🎂🥷🎈</div>
          <h1 className="font-display font-semibold text-white" style={{ fontSize: '2.2rem', lineHeight: 1.1 }}>
            Ninja Birthday Party
          </h1>
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
            by Ninja Academy Thailand
          </p>
        </div>

        {/* Intro */}
        <div className="rounded-2xl p-5 space-y-2 text-sm font-semibold"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)' }}>
          <p>🎉 <strong className="text-white">Ninja Birthday Party at Ninja Academy Thailand</strong> 🎉</p>
          <p>Celebrate your child's special day with our <strong className="text-white">Ninja Birthday Party Package</strong>, perfect for children aged <strong className="text-white">4 to 11 years old</strong>.</p>
          <p>
            📍 <strong className="text-white">Ninja School Sathorn</strong> – a private villa fully equipped for Ninja activities.{' '}
            <a href="https://maps.app.goo.gl/NinjaSchoolSathorn" target="_blank" rel="noopener noreferrer"
              className="font-bold underline" style={{ color: '#00C2E0' }}>
              Ninja School Sathorn on Google Maps →
            </a>
          </p>
        </div>

        {/* Info accordion */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <button className="w-full flex items-center justify-between px-5 py-4"
            onClick={() => setShowInfo(v => !v)}>
            <span className="font-display font-semibold text-white text-sm">Full details & what's included</span>
            {showInfo
              ? <ChevronUp size={16} style={{ color: '#CCFF00' }} />
              : <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />}
          </button>
          {showInfo && (
            <div className="px-5 pb-5 space-y-5 text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>

              <InfoBlock title="📍 Location">
                <p>Ninja School Sathorn – a private villa fully equipped for Ninja activities. The venue includes a garden, indoor training area, canteen, indoor &amp; outdoor kitchens, and secure parking.</p>
                <a href="https://maps.app.goo.gl/NinjaSchoolSathorn" target="_blank" rel="noopener noreferrer"
                  className="block mt-1 font-bold" style={{ color: '#00C2E0' }}>
                  Ninja School Sathorn on Google Maps →
                </a>
              </InfoBlock>

              <InfoBlock title="📅 Schedule">
                <ul className="space-y-1 mt-1">
                  <li>• <strong className="text-white">Days:</strong> Saturday &amp; Sunday (Weekday parties available upon request)</li>
                  <li>• <strong className="text-white">Time:</strong> 15:00 – 17:30 (2.5 hours standard, custom timing available)</li>
                  <li>• <strong className="text-white">Duration:</strong> Extra 30 minutes available at +100 THB per child</li>
                </ul>
              </InfoBlock>

              <InfoBlock title="👥 Group Size">
                <ul className="space-y-1 mt-1">
                  <li>• Minimum: 10 children</li>
                  <li>• Maximum: 50 children</li>
                </ul>
              </InfoBlock>

              <InfoBlock title="💰 Pricing">
                <ul className="space-y-1 mt-1">
                  <li>• 500 THB per child</li>
                  <li>• 1,000 THB deposit required to reserve your date</li>
                  <li>• Every child entering the facility is charged (regardless of age or participation). Adults attend free.</li>
                </ul>
              </InfoBlock>

              <InfoBlock title="✅ We Provide">
                <ul className="space-y-1 mt-1">
                  {[
                    'Venue (Ninja School Sathorn)',
                    'Team of coaches to lead games, training & fun activities',
                    'Tables and chairs for up to 50 people',
                    'Access to indoor & outdoor kitchens (deep frying, BBQ, stone oven, or smoke must be done outdoors)',
                    'Large fridge for birthday cake storage',
                    'Birthday decorations: balloons & banners',
                  ].map(i => <li key={i}>• {i}</li>)}
                </ul>
              </InfoBlock>

              <InfoBlock title="🧁 Parents Provide">
                <ul className="space-y-1 mt-1">
                  {[
                    'Food, drinks, and cake',
                    'Disposable plates, cutlery, and drinking cups',
                  ].map(i => <li key={i}>• {i}</li>)}
                </ul>
              </InfoBlock>

              <InfoBlock title="🚗 Parking Information">
                <ul className="space-y-1 mt-1">
                  <li>• 4 cars inside the center</li>
                  <li>• 2 cars the alley outside</li>
                  <li>• Additional parking available on Nanglinchi Soi 6 (before entering Yek 3), about a 200–300 meter walk</li>
                </ul>
              </InfoBlock>

              <div className="rounded-xl p-4 text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.60)' }}>
                If you are not yet familiar with <strong className="text-white">Ninja Academy Thailand</strong> or have never attended one of our Ninja Birthday Parties, we invite you to contact us via <strong className="text-white">LINE or WhatsApp</strong> to arrange a <strong className="text-white">free Ninja trial session (1–2 hours)</strong> at Ninja School Sathorn. Trials are available every day, including weekends.
                <br /><br />
                This gives you the perfect opportunity to visit our center, explore our program, and meet our coaches — by far the easiest way to get to know us.
              </div>

            </div>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4">
          <p className="font-display font-semibold text-white text-lg">Book your date 🎉</p>

          <FormCard>
            <Q label="Name of your child? *">
              <input className="finput" placeholder="Your answer" required
                value={form.kidName} onChange={e => set('kidName', e.target.value)} />
            </Q>
            <Q label="Girl or Boy *">
              <div className="flex gap-4">
                {['Girl', 'Boy'].map(g => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="kidGender" value={g} required
                      checked={form.kidGender === g} onChange={() => set('kidGender', g)} />
                    <span className="text-sm font-bold text-white">{g}</span>
                  </label>
                ))}
              </div>
            </Q>
            <Q label="What age will be celebrated? *">
              <input className="finput" placeholder="Your answer" type="number" min={4} max={11} required
                value={form.kidAge} onChange={e => set('kidAge', e.target.value)} />
            </Q>
          </FormCard>

          <FormCard>
            <Q label="Which day would you like to have the Ninja birthday party? *">
              <input className="finput" type="date" required
                value={form.preferredDate} onChange={e => set('preferredDate', e.target.value)} />
            </Q>
          </FormCard>

          <FormCard>
            <Q label="Your name? *">
              <input className="finput" placeholder="Your answer" required
                value={form.parentName} onChange={e => set('parentName', e.target.value)} />
            </Q>
            <Q label="Your phone number? *">
              <input className="finput" placeholder="Your answer" type="tel" required
                value={form.phone} onChange={e => set('phone', e.target.value)} />
            </Q>
            <Q label="Which communication app do you prefer? *">
              <div className="flex gap-4">
                {['Whatsapp', 'LINE'].map(app => (
                  <label key={app} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="commApp" value={app} required
                      checked={form.commApp === app} onChange={() => set('commApp', app)} />
                    <span className="text-sm font-bold text-white">{app}</span>
                  </label>
                ))}
              </div>
              {form.commApp === 'LINE' && (
                <input className="finput mt-2" placeholder="Your LINE ID" required
                  value={form.lineId} onChange={e => set('lineId', e.target.value)} />
              )}
            </Q>
          </FormCard>

          <FormCard>
            <Q label="What is your child favorite superhero ?">
              <input className="finput" placeholder="Your answer"
                value={form.favSuperhero} onChange={e => set('favSuperhero', e.target.value)} />
            </Q>
            <Q label="What is your child favorite color?">
              <input className="finput" placeholder="Your answer"
                value={form.favColor} onChange={e => set('favColor', e.target.value)} />
            </Q>
            <Q label="How many children do you expect? (+/-)">
              <input className="finput" placeholder="Your answer" type="number" min={10} max={50} required
                value={form.guestCount} onChange={e => set('guestCount', e.target.value)} />
            </Q>
          </FormCard>

          {error && <p className="text-sm font-bold" style={{ color: '#F87171' }}>{error}</p>}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-4 rounded-2xl font-display font-semibold text-base transition-all active:scale-98"
            style={{
              background: loading ? 'rgba(255,255,255,0.15)' : 'linear-gradient(90deg, #CCFF00, #a8e000)',
              color: '#0A1628',
              fontWeight: 700,
            }}>
            {loading ? 'Sending…' : 'Submit'}
          </button>

          <p className="text-xs text-center font-semibold" style={{ color: 'rgba(255,255,255,0.25)' }}>
            * Indicates required question
          </p>
        </div>

      </div>

      <style>{`
        .finput {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          border: 1.5px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: #fff;
          font-size: 0.9375rem;
          font-weight: 600;
          outline: none;
          transition: border-color 150ms;
          font-family: inherit;
        }
        .finput:focus { border-color: #CCFF00; }
        .finput::placeholder { color: rgba(255,255,255,0.25); font-weight: 500; }
        input[type=date].finput::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.4); }
        textarea.finput { resize: none; }
      `}</style>
    </div>
  )
}

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 space-y-4"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
      {children}
    </div>
  )
}

function Q({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-white">{label}</p>
      {children}
    </div>
  )
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-bold text-white mb-1">{title}</p>
      <div>{children}</div>
    </div>
  )
}
