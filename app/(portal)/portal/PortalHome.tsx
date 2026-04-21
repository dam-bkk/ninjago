'use client'

import { useState } from 'react'
import Link from 'next/link'
import LangSwitcher from '@/components/LangSwitcher'
import { useLang, t } from '@/lib/lang-context'
import Onboarding from './Onboarding'

type Location = { id: number; name: string }
type Package = {
  id: number; creditType: string
  totalCredits: number; usedCredits: number; expiresAt: Date | string | null; groupLabel: string | null
}
type StudentPackage = { package: Package; isPrimary: boolean }
type Student = {
  id: number; name: string; age: number | null; photoUrl: string | null
  locations: { location: Location }[]
  packages: StudentPackage[]
}
type Parent = {
  id: number; name: string | null; phone: string
  students: Student[]
}
type PortalEvent = {
  id: number
  name: string
  date: Date | string
  startTime: string
  endTime: string
  description: string | null
  creditType: string | null
  sessionType: string
  location: { name: string }
}

function creditBalance(student: Student, creditType: string) {
  return student.packages
    .filter(sp => sp.package.creditType === creditType)
    .reduce((acc, sp) => acc + sp.package.totalCredits - sp.package.usedCredits, 0)
}

function nearestExpiry(student: Student, creditType: string): string | null {
  const pkgs = student.packages
    .filter(sp => sp.package.creditType === creditType && sp.package.expiresAt)
    .map(sp => sp.package.expiresAt!)
    .sort()
  if (!pkgs.length) return null
  return new Date(pkgs[0]).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

const SESSION_TYPE_LABEL: Record<string, string> = {
  NINJA_CLASS: 'Ninja Class',
  NINJA_CAMP: 'Ninja Camp',
  BIRTHDAY: 'Birthday',
  SPECIAL_EVENT: 'Special Event',
  TRIAL: 'Trial',
}

const CREDIT_COLOR: Record<string, string> = {
  CLASS: '#00C2E0',
  CAMP: '#CCFF00',
  CAMP_EXTENDED: '#FFB400',
}

function EventCard({ event }: { event: PortalEvent }) {
  const d = new Date(event.date)
  const day   = d.toLocaleDateString('en-GB', { day: 'numeric' })
  const month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' })
  const accentColor = event.creditType ? CREDIT_COLOR[event.creditType] ?? '#00C2E0' : '#00C2E0'

  return (
    <div className="portal-card shrink-0 overflow-hidden"
      style={{ width: '220px', display: 'flex', flexDirection: 'column' }}>
      {/* Date strip */}
      <div className="flex items-center gap-3 px-4 py-3"
        style={{ background: '#0A1628', borderRadius: '1.25rem 1.25rem 0 0' }}>
        <div className="text-center">
          <p className="font-display font-semibold leading-none" style={{ color: accentColor, fontSize: '1.6rem' }}>{day}</p>
          <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.50)' }}>{month}</p>
        </div>
        <div style={{ width: 1, height: '2rem', background: 'rgba(255,255,255,0.10)' }} />
        <div>
          <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>{weekday}</p>
          <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.70)' }}>
            {event.startTime}–{event.endTime}
          </p>
        </div>
      </div>
      {/* Body */}
      <div className="px-4 py-3 flex-1 space-y-1.5">
        <p className="font-display font-semibold text-sm leading-tight" style={{ color: '#0A1628' }}>{event.name}</p>
        <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>{event.location.name}</p>
        {event.description && (
          <p className="text-xs" style={{ color: '#64748B', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
            {event.description}
          </p>
        )}
        <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${accentColor}22`, color: accentColor }}>
          {SESSION_TYPE_LABEL[event.sessionType] ?? event.sessionType}
        </span>
      </div>
    </div>
  )
}

export default function PortalHome({ parent, events = [] }: { parent: Parent; events?: PortalEvent[] }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const { lang } = useLang()
  const d = t(lang)

  const students = parent.students
  const student = students[activeIdx]

  const classCredits    = student ? creditBalance(student, 'CLASS') : 0
  const campCredits     = student ? creditBalance(student, 'CAMP') : 0
  const extendedCredits = student ? creditBalance(student, 'CAMP_EXTENDED') : 0

  const classExpiry    = student ? nearestExpiry(student, 'CLASS') : null
  const campExpiry     = student ? nearestExpiry(student, 'CAMP') : null
  const extExpiry      = student ? nearestExpiry(student, 'CAMP_EXTENDED') : null

  const location = student?.locations[0]?.location?.name ?? '—'
  const initials = (student?.name ?? 'NA').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const firstName = parent.name?.split(' ')[0] ?? ''

  return (
    <div className="portal min-h-screen">
      <Onboarding />
      <div className="max-w-md mx-auto px-5 pb-10 space-y-5">

        {/* Header */}
        <div className="pt-8 pb-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-semibold" style={{ color: '#0A1628', fontSize: '2rem' }}>
                <span className="highlight-navy">Ninja</span> Academy
              </h1>
              {firstName && (
                <p className="text-sm font-semibold mt-1" style={{ color: 'rgba(10,22,40,0.55)' }}>
                  {d.hello(firstName)}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <LangSwitcher />
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-display font-semibold text-sm"
                style={{ background: '#0A1628', color: '#CCFF00' }}>
                {initials}
              </div>
            </div>
          </div>
        </div>

        {/* Student selector — show tabs if multiple */}
        {students.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {students.map((s, i) => (
              <button key={s.id} onClick={() => setActiveIdx(i)}
                className="tag shrink-0"
                style={i === activeIdx
                  ? { background: '#0A1628', color: '#CCFF00' }
                  : { background: 'rgba(255,255,255,0.30)', color: '#0A1628', border: '1.5px solid rgba(255,255,255,0.50)' }
                }>
                {s.name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {/* Credit card */}
        {student ? (
          <div className="portal-card-dark p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-white font-semibold" style={{ fontSize: '1.35rem' }}>{student.name}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="tag" style={{ background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.70)', fontSize: '0.75rem', padding: '0.25rem 0.7rem' }}>
                    Age {student.age}
                  </span>
                  <span className="tag" style={{ background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.70)', fontSize: '0.75rem', padding: '0.25rem 0.7rem' }}>
                    {location}
                  </span>
                </div>
              </div>
              <span className="tag tag-lime" style={{ fontSize: '0.75rem' }}>✓ Active</span>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

            <div className="grid grid-cols-3 gap-2">
              {/* Class */}
              <div className="rounded-2xl p-3 text-center"
                style={{ background: 'rgba(0,194,224,0.12)', border: '1px solid rgba(0,194,224,0.20)' }}>
                <p className="font-display font-semibold" style={{ color: '#00C2E0', fontSize: '1.75rem', lineHeight: 1 }}>{classCredits}</p>
                <p className="text-xs font-bold mt-1.5" style={{ color: 'rgba(255,255,255,0.50)' }}>{d.classCredits}</p>
                {classExpiry && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem' }}>{d.expires(classExpiry)}</p>}
              </div>

              {/* Camp */}
              <div className="rounded-2xl p-3 text-center"
                style={{ background: 'rgba(204,255,0,0.08)', border: '1px solid rgba(204,255,0,0.15)' }}>
                <p className="font-display font-semibold" style={{ color: '#CCFF00', fontSize: '1.75rem', lineHeight: 1 }}>{campCredits}</p>
                <p className="text-xs font-bold mt-1.5" style={{ color: 'rgba(255,255,255,0.50)' }}>{d.campCredits}</p>
                {campExpiry && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem' }}>{d.expires(campExpiry)}</p>}
              </div>

              {/* Extended */}
              <div className="rounded-2xl p-3 text-center"
                style={{ background: 'rgba(255,180,0,0.10)', border: '1px solid rgba(255,180,0,0.20)' }}>
                <p className="font-display font-semibold" style={{ color: '#FFB400', fontSize: '1.75rem', lineHeight: 1 }}>{extendedCredits}</p>
                <p className="text-xs font-bold mt-1.5" style={{ color: 'rgba(255,255,255,0.50)' }}>{d.extCredits}</p>
                {extExpiry && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem' }}>{d.expires(extExpiry)}</p>}
              </div>
            </div>

            <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {d.credits(classCredits + campCredits + extendedCredits)} total · shared packs included
            </p>
          </div>
        ) : (
          <div className="portal-card-dark p-6 text-center">
            <p className="text-white font-display font-semibold">{d.noStudentFound}</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.40)' }}>{d.contactManager}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">

          {/* Book — primary CTA */}
          <Link href="/portal/book"
            className="w-full flex items-center justify-center gap-3 font-display font-semibold transition-all active:scale-97"
            style={{ background: '#CCFF00', color: '#0A1628', padding: '1rem 1.5rem', borderRadius: '1.25rem', fontSize: '1.1rem', boxShadow: '0 4px 20px rgba(204,255,0,0.35)' }}>
            {/* Shuriken */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L10 10L2 12L10 14L12 22L14 14L22 12L14 10Z" fill="#0A1628" opacity="0.20"/>
              <path d="M12 2L10 10L2 12L10 14L12 22L14 14L22 12L14 10Z" stroke="#0A1628" strokeWidth="1.6" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" fill="#0A1628"/>
              <circle cx="12" cy="12" r="1.5" fill="#CCFF00"/>
            </svg>
            {d.bookSession}
          </Link>

          {/* Secondary row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Schedule */}
            <Link href="/portal/schedule"
              className="flex flex-col items-center justify-center gap-3 transition-all active:scale-97"
              style={{ background: '#0A1628', padding: '1.25rem', borderRadius: '1.25rem', minHeight: '110px' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(0,194,224,0.15)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="16" rx="3" stroke="#00C2E0" strokeWidth="1.8"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="#00C2E0" strokeWidth="1.8"/>
                  <rect x="7" y="2" width="2.5" height="6" rx="1.25" fill="#00C2E0"/>
                  <rect x="14.5" y="2" width="2.5" height="6" rx="1.25" fill="#00C2E0"/>
                  <path d="M12 14L12.7 16H15L13.4 17.4L14 19.5L12 18.2L10 19.5L10.6 17.4L9 16H11.3Z" fill="#CCFF00"/>
                </svg>
              </div>
              <span className="font-display font-semibold text-base text-white">{d.schedule}</span>
            </Link>

            {/* Top Up */}
            <Link href="/portal/topup"
              className="flex flex-col items-center justify-center gap-3 transition-all active:scale-97"
              style={{ background: '#0A1628', padding: '1.25rem', borderRadius: '1.25rem', minHeight: '110px' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,180,0,0.15)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="7" width="18" height="13" rx="3" stroke="#FFB400" strokeWidth="1.8"/>
                  <rect x="3" y="7" width="18" height="5.5" rx="3" fill="#FFB400" opacity="0.20"/>
                  <line x1="3" y1="12.5" x2="21" y2="12.5" stroke="#FFB400" strokeWidth="1.5" opacity="0.35"/>
                  <circle cx="17" cy="16" r="1.8" fill="#FFB400"/>
                  <path d="M12 1 L12 5 M10 3 L14 3" stroke="#CCFF00" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-display font-semibold text-base text-white">{d.topUp}</span>
            </Link>
          </div>

          {/* QR Check-in */}
          <Link href="/portal/checkin"
            className="w-full flex items-center gap-4 transition-all active:scale-97"
            style={{ background: 'rgba(255,255,255,0.60)', border: '1.5px solid rgba(255,255,255,0.80)', padding: '1rem 1.25rem', borderRadius: '1.25rem' }}>
            {/* QR icon in dark pill */}
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#0A1628' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#CCFF00" strokeWidth="1.6"/>
                <rect x="5" y="5" width="4" height="4" rx="0.5" fill="#CCFF00" opacity="0.5"/>
                <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#CCFF00" strokeWidth="1.6"/>
                <rect x="15" y="5" width="4" height="4" rx="0.5" fill="#CCFF00" opacity="0.5"/>
                <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#CCFF00" strokeWidth="1.6"/>
                <rect x="5" y="15" width="4" height="4" rx="0.5" fill="#CCFF00" opacity="0.5"/>
                <rect x="13" y="13" width="2.5" height="2.5" rx="0.5" fill="#CCFF00" opacity="0.6"/>
                <rect x="17" y="13" width="2.5" height="2.5" rx="0.5" fill="#CCFF00" opacity="0.6"/>
                <rect x="13" y="17" width="2.5" height="2.5" rx="0.5" fill="#CCFF00" opacity="0.6"/>
                <rect x="17" y="17" width="2.5" height="2.5" rx="0.5" fill="#CCFF00" opacity="0.6"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold text-sm" style={{ color: '#0A1628' }}>QR Check-in</p>
              <p className="text-xs font-semibold" style={{ color: 'rgba(10,22,40,0.50)' }}>For your nanny or guardian</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(10,22,40,0.30)' }}>
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </Link>

        </div>

        {/* Upcoming events */}
        {events.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {/* Shuriken SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: '#0A1628' }}>
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" fill="currentColor" opacity="0.15"/>
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
              </svg>
              <p className="font-display font-semibold text-sm" style={{ color: '#0A1628' }}>Upcoming Events</p>
            </div>
            {/* Horizontal scroll */}
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ marginLeft: '-1.25rem', marginRight: '-1.25rem', paddingLeft: '1.25rem', paddingRight: '1.25rem' }}>
              {events.map(ev => <EventCard key={ev.id} event={ev} />)}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
