'use client'

import { useState, useEffect, useRef } from 'react'

const SLIDES = [
  {
    icon: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="140" height="140">
        {/* Shuriken */}
        <circle cx="60" cy="60" r="56" fill="#0A1628" />
        <g transform="translate(60,60)">
          <path d="M0-36 L8-8 L36 0 L8 8 L0 36 L-8 8 L-36 0 L-8-8Z" fill="#CCFF00" opacity="0.15"/>
          <path d="M0-36 L8-8 L36 0 L8 8 L0 36 L-8 8 L-36 0 L-8-8Z" stroke="#CCFF00" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="0" cy="0" r="9" fill="#CCFF00"/>
          <circle cx="0" cy="0" r="4" fill="#0A1628"/>
        </g>
        <circle cx="60" cy="60" r="56" stroke="#CCFF00" strokeWidth="1.5" strokeOpacity="0.2"/>
      </svg>
    ),
    title: 'Welcome to\nNinja Academy',
    body: 'Everything you need to manage your child\'s sessions — booking, check-in, credits — right from your phone.',
    accent: '#CCFF00',
  },
  {
    icon: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="140" height="140">
        <circle cx="60" cy="60" r="56" fill="#0A1628" />
        {/* Calendar */}
        <rect x="28" y="34" width="64" height="56" rx="8" fill="none" stroke="#00C2E0" strokeWidth="2"/>
        <rect x="28" y="34" width="64" height="20" rx="8" fill="#00C2E0" opacity="0.15"/>
        <line x1="28" y1="54" x2="92" y2="54" stroke="#00C2E0" strokeWidth="1.5" opacity="0.4"/>
        <rect x="44" y="26" width="4" height="16" rx="2" fill="#00C2E0"/>
        <rect x="72" y="26" width="4" height="16" rx="2" fill="#00C2E0"/>
        {/* Checkmark */}
        <circle cx="60" cy="76" r="12" fill="#CCFF00"/>
        <path d="M54 76 L58 80 L67 71" stroke="#0A1628" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Book a session\nin seconds',
    body: 'Browse available sessions by date, pick a time slot, and confirm. Your credits are deducted automatically.',
    accent: '#00C2E0',
  },
  {
    icon: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="140" height="140">
        <circle cx="60" cy="60" r="56" fill="#0A1628" />
        {/* QR code simplified */}
        <rect x="30" y="30" width="24" height="24" rx="3" stroke="#CCFF00" strokeWidth="2"/>
        <rect x="36" y="36" width="12" height="12" rx="1.5" fill="#CCFF00" opacity="0.5"/>
        <rect x="66" y="30" width="24" height="24" rx="3" stroke="#CCFF00" strokeWidth="2"/>
        <rect x="72" y="36" width="12" height="12" rx="1.5" fill="#CCFF00" opacity="0.5"/>
        <rect x="30" y="66" width="24" height="24" rx="3" stroke="#CCFF00" strokeWidth="2"/>
        <rect x="36" y="72" width="12" height="12" rx="1.5" fill="#CCFF00" opacity="0.5"/>
        {/* dots bottom right */}
        <rect x="66" y="66" width="6" height="6" rx="1" fill="#CCFF00" opacity="0.6"/>
        <rect x="75" y="66" width="6" height="6" rx="1" fill="#CCFF00" opacity="0.6"/>
        <rect x="84" y="66" width="6" height="6" rx="1" fill="#CCFF00" opacity="0.6"/>
        <rect x="66" y="75" width="6" height="6" rx="1" fill="#CCFF00" opacity="0.6"/>
        <rect x="84" y="75" width="6" height="6" rx="1" fill="#CCFF00" opacity="0.6"/>
        <rect x="66" y="84" width="6" height="6" rx="1" fill="#CCFF00" opacity="0.6"/>
        <rect x="75" y="84" width="6" height="6" rx="1" fill="#CCFF00" opacity="0.6"/>
        <rect x="84" y="84" width="6" height="6" rx="1" fill="#CCFF00" opacity="0.6"/>
      </svg>
    ),
    title: 'QR check-in\nfor drop-off',
    body: 'Generate a QR code for your nanny or guardian to scan at the door. No phone needed on their end.',
    accent: '#CCFF00',
  },
  {
    icon: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="140" height="140">
        <circle cx="60" cy="60" r="56" fill="#0A1628" />
        {/* Credit card */}
        <rect x="24" y="40" width="72" height="44" rx="8" fill="none" stroke="#FFB400" strokeWidth="2"/>
        <rect x="24" y="40" width="72" height="16" rx="8" fill="#FFB400" opacity="0.15"/>
        <rect x="34" y="72" width="16" height="6" rx="2" fill="#FFB400" opacity="0.5"/>
        <rect x="56" y="72" width="10" height="6" rx="2" fill="#FFB400" opacity="0.3"/>
        {/* Plus badge */}
        <circle cx="85" cy="42" r="13" fill="#0A1628" stroke="#FFB400" strokeWidth="1.5"/>
        <path d="M85 36 L85 48 M79 42 L91 42" stroke="#FFB400" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Top up your\ncredits',
    body: 'Running low? Request a package directly in the app. We\'ll confirm your top-up by WhatsApp.',
    accent: '#FFB400',
  },
  {
    icon: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="140" height="140">
        <circle cx="60" cy="60" r="56" fill="#0A1628" />
        {/* Shield / cancel */}
        <path d="M60 28 L84 38 L84 62 C84 76 72 86 60 92 C48 86 36 76 36 62 L36 38 Z" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="rgba(255,255,255,0.04)"/>
        {/* Calendar with X */}
        <rect x="40" y="44" width="40" height="36" rx="6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
        <line x1="40" y1="55" x2="80" y2="55" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
        <rect x="50" y="37" width="4" height="12" rx="2" fill="rgba(255,255,255,0.4)"/>
        <rect x="66" y="37" width="4" height="12" rx="2" fill="rgba(255,255,255,0.4)"/>
        <path d="M52 66 L68 74 M68 66 L52 74" stroke="#FF6B6B" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Cancel anytime,\nno stress',
    body: 'Need to cancel? Manage your upcoming bookings from the Schedule tab. Your credit is returned automatically.',
    accent: '#FF6B6B',
  },
]

export default function Onboarding({ forceShow, onClose }: { forceShow?: boolean; onClose?: () => void } = {}) {
  const [visible, setVisible] = useState(false)
  const [slide, setSlide] = useState(0)
  const startX = useRef<number | null>(null)

  useEffect(() => {
    if (forceShow) {
      setSlide(0)
      setVisible(true)
    }
  }, [forceShow])

  useEffect(() => {
    if (!forceShow && !localStorage.getItem('ninja-onboarding-done')) {
      setVisible(true)
    }
  }, [forceShow])

  function dismiss() {
    localStorage.setItem('ninja-onboarding-done', '1')
    setVisible(false)
    onClose?.()
  }

  function next() {
    if (slide < SLIDES.length - 1) setSlide(s => s + 1)
    else dismiss()
  }

  function prev() {
    if (slide > 0) setSlide(s => s - 1)
  }

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (startX.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    if (dx < -40) next()
    else if (dx > 40) prev()
    startX.current = null
  }

  if (!visible) return null

  const s = SLIDES[slide]
  const isLast = slide === SLIDES.length - 1

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#00C2E0' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Skip */}
      <div className="flex justify-end px-6 pt-6">
        <button
          onClick={dismiss}
          className="text-sm font-bold"
          style={{ color: 'rgba(10,22,40,0.50)' }}
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
        {/* Icon */}
        <div className="flex items-center justify-center"
          style={{
            filter: 'drop-shadow(0 12px 32px rgba(10,22,40,0.30))',
          }}>
          {s.icon}
        </div>

        {/* Text */}
        <div className="text-center space-y-3 max-w-xs">
          <h2 className="font-display font-semibold leading-tight" style={{ color: '#0A1628', fontSize: '1.75rem', whiteSpace: 'pre-line' }}>
            {s.title}
          </h2>
          <p className="text-sm font-semibold leading-relaxed" style={{ color: 'rgba(10,22,40,0.65)' }}>
            {s.body}
          </p>
        </div>
      </div>

      {/* Dots + button */}
      <div className="px-6 pb-10 space-y-6">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              style={{
                width: i === slide ? '20px' : '7px',
                height: '7px',
                borderRadius: '9999px',
                background: i === slide ? '#0A1628' : 'rgba(10,22,40,0.20)',
                transition: 'all 200ms',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={next}
          className="w-full font-display font-semibold transition-all active:scale-97"
          style={{
            background: '#0A1628',
            color: '#CCFF00',
            padding: '1rem',
            borderRadius: '1rem',
            fontSize: '1.05rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {isLast ? "Let's go! 🥷" : 'Next →'}
        </button>
      </div>
    </div>
  )
}
