'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LangSwitcher from '@/components/LangSwitcher'
import { useLang, t, type Lang } from '@/lib/lang-context'

type Step = 'phone' | 'pin'

export default function ParentLoginPage() {
  const router = useRouter()
  const { lang, setLang } = useLang()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const d = t(lang)

  useEffect(() => {
    if (step === 'pin') {
      setTimeout(() => pinRefs[0].current?.focus(), 80)
    }
  }, [step])

  function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    const normalized = phone.replace(/\s+/g, '').trim()
    if (normalized.length < 9) {
      setError('Enter a valid phone number')
      return
    }
    setError('')
    setStep('pin')
  }

  function handlePinChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return
    const next = [...pin]
    next[index] = value
    setPin(next)
    if (value && index < 3) {
      pinRefs[index + 1].current?.focus()
    }
    if (value && index === 3) {
      const full = [...next.slice(0, 3), value].join('')
      if (full.length === 4) submitPin(full)
    }
  }

  function handlePinKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus()
    }
  }

  async function submitPin(pinStr: string) {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\s+/g, '').trim(), pin: pinStr, termsAccepted }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? d.wrongPin)
        setPin(['', '', '', ''])
        setTimeout(() => pinRefs[0].current?.focus(), 80)
        return
      }
      // Sync lang from DB preference
      if (data.preferredLang && ['en', 'th', 'fr'].includes(data.preferredLang)) {
        setLang(data.preferredLang)
      }
      router.push('/portal')
    } catch {
      setError(d.networkError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-8">

        {/* Lang switcher — top right */}
        <div className="flex justify-end">
          <LangSwitcher />
        </div>

        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2"
            style={{ background: '#0A1628' }}>
            <span style={{ fontSize: '2rem' }}>🥷</span>
          </div>
          <h1 className="font-display font-semibold" style={{ color: '#0A1628', fontSize: '1.75rem' }}>
            {step === 'phone' ? d.welcome : d.enterPin}
          </h1>
          <p className="text-sm font-semibold" style={{ color: 'rgba(10,22,40,0.50)' }}>
            {step === 'phone' ? d.enterPhone : d.enterPinFor(phone)}
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+66 81 234 5678"
              required
              autoComplete="tel"
              autoFocus
              className="input-dark"
              style={{
                background: 'rgba(10,22,40,0.08)',
                border: '1.5px solid rgba(10,22,40,0.15)',
                color: '#0A1628',
                textAlign: 'center',
                fontSize: '1.2rem',
                letterSpacing: '0.05em',
              }}
            />

            {/* CGU */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" required
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded shrink-0 accent-current"
                style={{ accentColor: '#0A1628' }} />
              <span className="text-xs font-semibold leading-relaxed" style={{ color: 'rgba(10,22,40,0.55)' }}>
                {d.terms}{' '}
                <a href="/terms" target="_blank" className="underline font-bold" style={{ color: '#0A1628' }}>
                  {d.termsLink}
                </a>{' '}
                {d.and}{' '}
                <a href="/privacy" target="_blank" className="underline font-bold" style={{ color: '#0A1628' }}>
                  {d.privacyLink}
                </a>
              </span>
            </label>

            {error && (
              <p className="text-sm font-bold text-center" style={{ color: '#DC2626' }}>{error}</p>
            )}

            <button type="submit" className="btn-ninja w-full font-display"
              style={{ fontSize: '1rem', fontWeight: 600 }}>
              {d.continue}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {/* PIN boxes */}
            <div className="flex justify-center gap-3">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handlePinChange(i, e.target.value)}
                  onKeyDown={e => handlePinKeyDown(i, e)}
                  className="pin-input"
                  style={{
                    background: 'rgba(10,22,40,0.08)',
                    border: `2px solid ${digit ? '#0A1628' : 'rgba(10,22,40,0.20)'}`,
                    color: '#0A1628',
                  }}
                  disabled={loading}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm font-bold text-center" style={{ color: '#DC2626' }}>{error}</p>
            )}

            {loading && (
              <p className="text-sm font-bold text-center" style={{ color: 'rgba(10,22,40,0.50)' }}>
                Checking…
              </p>
            )}

            <button
              onClick={() => { setStep('phone'); setPin(['', '', '', '']); setError('') }}
              className="btn-ghost w-full font-display"
              style={{ fontWeight: 600 }}
            >
              {d.changeNumber}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
