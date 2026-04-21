'use client'

import { useState } from 'react'
import { Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLang, t } from '@/lib/lang-context'

type Session = {
  id: number; name: string; startTime: string; endTime: string
  creditType: string; dayOfWeek: number | null; includeLunch: boolean
  location: { name: string }
  _bookingCount?: number
}

function creditColor(t: string) {
  return t === 'CLASS' ? '#00C2E0' : t === 'CAMP' ? '#CCFF00' : '#FFB400'
}

function startOfWeek(d: Date) {
  const clone = new Date(d)
  const day = clone.getDay()
  clone.setDate(clone.getDate() - day + 1) // Monday
  clone.setHours(0, 0, 0, 0)
  return clone
}

function addDays(d: Date, n: number) {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export default function ScheduleClient({ sessions }: { sessions: Session[] }) {
  const [view, setView] = useState<'week' | 'month'>('week')
  const [anchor, setAnchor] = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d
  })
  const { lang } = useLang()
  const d = t(lang)

  // ── Week view ────────────────────────────────────────────
  const weekStart = startOfWeek(anchor)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // ── Month view ───────────────────────────────────────────
  const monthStart = startOfMonth(anchor)
  const firstCell = startOfWeek(monthStart)
  const monthCells: Date[] = Array.from({ length: 35 }, (_, i) => addDays(firstCell, i))

  function sessionsForDay(date: Date) {
    const dow = date.getDay()
    return sessions.filter(s => s.dayOfWeek === dow)
  }

  function navigate(n: number) {
    setAnchor(prev => {
      const d = new Date(prev)
      if (view === 'week') d.setDate(d.getDate() + n * 7)
      else d.setMonth(d.getMonth() + n)
      return d
    })
  }

  const today = new Date(); today.setHours(0,0,0,0)
  const locale = lang === 'th' ? 'th-TH' : lang === 'fr' ? 'fr-FR' : 'en-GB'

  const periodLabel = view === 'week'
    ? `${weekDays[0].toLocaleDateString(locale, { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`
    : `${d.months[anchor.getMonth()]} ${anchor.getFullYear()}`

  return (
    <div className="space-y-4">

      {/* View toggle + navigation */}
      <div className="flex items-center justify-between gap-3">
        {/* Toggle */}
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(10,22,40,0.15)' }}>
          {(['week', 'month'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className="px-4 py-1.5 text-xs font-bold transition-colors"
              style={view === v
                ? { background: '#0A1628', color: '#CCFF00' }
                : { background: 'rgba(255,255,255,0.40)', color: '#0A1628' }}>
              {v === 'week' ? d.week : d.month}
            </button>
          ))}
        </div>

        {/* Nav */}
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.30)' }}>
            <ChevronLeft size={16} style={{ color: '#0A1628' }} />
          </button>
          <span className="text-xs font-bold px-2" style={{ color: '#0A1628' }}>{periodLabel}</span>
          <button onClick={() => navigate(1)}
            className="w-8 h-8 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.30)' }}>
            <ChevronRight size={16} style={{ color: '#0A1628' }} />
          </button>
        </div>
      </div>

      {/* ── WEEK VIEW ────────────────────────────────────── */}
      {view === 'week' && (
        <div className="space-y-2">
          {weekDays.map(day => {
            const daySessions = sessionsForDay(day)
            const isPast = day < today
            const isToday = day.getTime() === today.getTime()
            return (
              <div key={day.toISOString()}>
                {/* Day header */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
                    style={isToday ? { background: '#0A1628' } : {}}>
                    <div className="text-center">
                      <p className="text-xs font-black leading-none"
                        style={{ color: isToday ? '#CCFF00' : isPast ? 'rgba(10,22,40,0.35)' : '#0A1628', fontSize: '0.6rem' }}>
                        {d.days[day.getDay()]}
                      </p>
                      <p className="font-display font-semibold leading-none"
                        style={{ color: isToday ? '#CCFF00' : isPast ? 'rgba(10,22,40,0.35)' : '#0A1628', fontSize: '0.9rem' }}>
                        {day.getDate()}
                      </p>
                    </div>
                  </div>
                  {daySessions.length === 0 && (
                    <p className="text-xs font-semibold" style={{ color: 'rgba(10,22,40,0.25)' }}>{d.noSessions}</p>
                  )}
                </div>

                {daySessions.map(s => {
                  const color = creditColor(s.creditType)
                  const count = s._bookingCount ?? 0
                  return (
                    <div key={s.id} className="portal-card p-3 mb-1.5 flex items-center gap-3"
                      style={{ opacity: isPast ? 0.55 : 1, borderLeft: `3px solid ${color}` }}>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-sm truncate" style={{ color: '#0A1628' }}>{s.name}</p>
                        <p className="text-xs font-semibold mt-0.5 flex items-center gap-1" style={{ color: '#5B8FA8' }}>
                          <Clock size={10} />{s.startTime}–{s.endTime}
                          <span className="mx-0.5">·</span>
                          <MapPin size={10} />{s.location.name}
                        </p>
                      </div>
                      {count > 0 && (
                        <div className="shrink-0 text-center">
                          <span className="tag" style={{
                            background: `${color}22`, color,
                            fontSize: '0.65rem', padding: '0.15rem 0.5rem',
                          }}>
                            {d.booked_count(count)}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* ── MONTH VIEW ───────────────────────────────────── */}
      {view === 'month' && (
        <div>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {[...d.days.slice(1), d.days[0]].map((day, i) => (
              <p key={i} className="text-center text-xs font-black py-1"
                style={{ color: 'rgba(10,22,40,0.35)' }}>{day}</p>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {monthCells.map(day => {
              const inMonth = sameMonth(day, anchor)
              const isToday = day.getTime() === today.getTime()
              const daySessions = sessionsForDay(day)
              const totalBookings = daySessions.reduce((a, s) => a + (s._bookingCount ?? 0), 0)

              return (
                <div key={day.toISOString()}
                  className="rounded-xl p-1.5 min-h-[52px]"
                  style={{
                    background: isToday ? '#0A1628'
                      : !inMonth ? 'transparent'
                      : 'rgba(255,255,255,0.35)',
                    opacity: inMonth ? 1 : 0.3,
                  }}>
                  <p className="text-xs font-black text-center mb-0.5"
                    style={{ color: isToday ? '#CCFF00' : '#0A1628' }}>
                    {day.getDate()}
                  </p>
                  {inMonth && daySessions.slice(0, 2).map(s => (
                    <div key={s.id}
                      className="rounded-md mb-0.5 px-1 py-0.5 text-center"
                      style={{ background: creditColor(s.creditType) + '33' }}>
                      <div className="w-1.5 h-1.5 rounded-full mx-auto"
                        style={{ background: creditColor(s.creditType) }} />
                    </div>
                  ))}
                  {inMonth && totalBookings > 0 && (
                    <p className="text-center font-black" style={{ fontSize: '0.55rem', color: '#5B8FA8' }}>
                      {totalBookings}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
