'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Utensils, User, X, CheckCircle, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December']

const COACH_RATIO = 8
// Vivid, clearly distinct colors per location
const LOCATION_COLORS = ['#C2410C', '#3730A3', '#065F46', '#9F1239']

function getLocationColor(locationId: number, locations: Location[]): string {
  const idx = locations.findIndex(l => l.id === locationId)
  return LOCATION_COLORS[idx >= 0 ? idx % LOCATION_COLORS.length : 0]
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// Layout sessions in columns to handle overlaps
function layoutSessions(sessions: Session[]): Array<{ session: Session; col: number; numCols: number }> {
  if (sessions.length === 0) return []
  const sorted = [...sessions].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))
  const colEnds: number[] = []
  const sessionCols: number[] = []
  for (const s of sorted) {
    const start = parseTime(s.startTime)
    const end   = parseTime(s.endTime)
    let ci = colEnds.findIndex(e => e <= start)
    if (ci === -1) { ci = colEnds.length; colEnds.push(end) } else { colEnds[ci] = end }
    sessionCols.push(ci)
  }
  const totalCols = colEnds.length
  return sorted.map((s, i) => ({ session: s, col: sessionCols[i], numCols: totalCols }))
}

type Session = {
  id: number; name: string; startTime: string; endTime: string
  creditType: string; dayOfWeek: number | null
  periodType: string
  includeLunch: boolean
  location: { id: number; name: string }
}
type Event = {
  id: number; name: string; startTime: string; endTime: string
  sessionType: string; creditType: string | null
  date: Date | string
  location: { id: number; name: string }
  maxCapacity: number | null; description: string | null
}
type CalendarOverride = {
  id: number; date: Date | string; periodType: string; note: string | null
}
type Location = { id: number; name: string }
type DayCounts = { total: number; meals: number }
type Reservation = {
  id: number
  status: string
  student: { id: number; name: string; age: number }
  attendance: { id: number; lunch: boolean; checkedInAt: string } | null
}

function creditColor(t: string) {
  return t === 'CLASS' ? '#00C2E0' : t === 'CAMP' ? '#CCFF00' : '#FFB400'
}
function creditLabel(t: string) {
  return t === 'CLASS' ? 'Class' : t === 'CAMP' ? 'Camp' : 'Ext'
}
function coachesNeeded(n: number) { return n > 0 ? Math.ceil(n / COACH_RATIO) : 0 }
function toDateStr(d: Date) { return d.toISOString().split('T')[0] }
function mondayOf(ref: Date) {
  const d = new Date(ref); const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); d.setHours(0,0,0,0); return d
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }

// ── Session card (shared between views) ─────────────────────
function SessionCard({
  session, dateStr, counts, onClick, locColor, compact = false,
}: {
  session: Session; dateStr: string
  counts: Record<number, Record<string, DayCounts>>
  onClick: () => void
  locColor: string
  compact?: boolean
}) {
  const c = counts[session.id]?.[dateStr]
  const hasKids = c && c.total > 0
  // Solid color if bookings, tinted if empty
  const bg = hasKids ? locColor : `${locColor}22`
  const textColor = hasKids ? '#ffffff' : locColor
  const mutedColor = hasKids ? 'rgba(255,255,255,0.65)' : `${locColor}99`
  return (
    <button onClick={onClick} className="w-full h-full text-left rounded-xl transition-all active:scale-95"
      style={{ background: bg }}>
      <div className="p-2 h-full flex flex-col">
        <p className="text-xs font-bold leading-tight truncate" style={{ color: textColor }}>
          {session.name}
        </p>
        {!compact && (
          <p className="text-xs font-semibold mt-0.5" style={{ color: mutedColor }}>
            {session.startTime}–{session.endTime}
          </p>
        )}
        {hasKids ? (
          <div className="mt-auto pt-1 flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-black" style={{ color: '#ffffff' }}>
              {c!.total} kid{c!.total !== 1 ? 's' : ''}
            </span>
            {!compact && (
              <>
                <span className="flex items-center gap-0.5 text-xs font-bold"
                  style={{ color: coachesNeeded(c!.total) >= 2 ? '#FFD700' : 'rgba(255,255,255,0.7)' }}>
                  <User size={9} />{coachesNeeded(c!.total)}
                </span>
                {c!.meals > 0 && (
                  <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: '#FFD700' }}>
                    <Utensils size={9} />{c!.meals}
                  </span>
                )}
              </>
            )}
          </div>
        ) : (
          !compact && (
            <p className="text-xs font-semibold mt-auto pt-1" style={{ color: mutedColor }}>Empty</p>
          )
        )}
      </div>
    </button>
  )
}

// ── Booking modal ────────────────────────────────────────────
function BookingModal({
  session, dateStr, onClose,
}: {
  session: Session; dateStr: string; onClose: () => void
}) {
  const [reservations, setReservations] = useState<Reservation[] | null>(null)
  const color = creditColor(session.creditType)

  useEffect(() => {
    fetch(`/api/admin/sessions/reservations?sessionId=${session.id}&date=${dateStr}`)
      .then(r => r.json())
      .then(d => setReservations(d.reservations ?? []))
  }, [session.id, dateStr])

  const date = new Date(dateStr)
  const dateLabel = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-5 border-b flex items-start justify-between gap-3" style={{ borderColor: '#E2E8F0' }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <p className="font-display font-semibold text-base" style={{ color: '#0A1628' }}>{session.name}</p>
            </div>
            <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
              {dateLabel} · {session.startTime} – {session.endTime} · {session.location.name}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {reservations === null ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>Loading…</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>No bookings for this session</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#F1F5F9' }}>
              {reservations.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3"
                  style={{ background: r.attendance ? '#F8FFF0' : 'white' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0"
                    style={{ background: r.attendance ? '#CCFF00' : '#F1F5F9', color: '#0A1628' }}>
                    {r.attendance
                      ? <CheckCircle size={16} style={{ color: '#22C55E' }} />
                      : r.student.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/students/${r.student.id}`}
                      className="font-bold text-sm flex items-center gap-1 hover:underline"
                      style={{ color: '#0A1628' }}
                      onClick={onClose}>
                      {r.student.name}
                      <ExternalLink size={11} style={{ color: '#94A3B8' }} />
                    </Link>
                    <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                      Age {r.student.age}
                      {r.attendance && ` · Checked in ${new Date(r.attendance.checkedInAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                      {r.attendance?.lunch && ' · 🍱 lunch'}
                    </p>
                  </div>
                  {r.attendance && <span className="badge badge-green shrink-0">✓ In</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer summary */}
        {reservations && reservations.length > 0 && (
          <div className="px-5 py-3 border-t flex items-center gap-4" style={{ borderColor: '#E2E8F0' }}>
            <p className="text-xs font-bold" style={{ color: '#0A1628' }}>
              {reservations.length} booked · {reservations.filter(r => r.attendance).length} checked in
            </p>
            <p className="text-xs font-bold flex items-center gap-1"
              style={{ color: coachesNeeded(reservations.length) >= 2 ? '#EF4444' : '#64748B' }}>
              <User size={11} /> {coachesNeeded(reservations.length)} coach{coachesNeeded(reservations.length) !== 1 ? 'es' : ''} needed
            </p>
            {reservations.filter(r => r.attendance?.lunch).length > 0 && (
              <p className="text-xs font-bold flex items-center gap-1" style={{ color: '#F59E0B' }}>
                <Utensils size={11} /> {reservations.filter(r => r.attendance?.lunch).length} meals
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Time grid (shared between weekday & weekend panels) ──────
function TimeGrid({
  days, filtered, counts, locations, today, setModal, events = [], overrides = [], pxPerMin = 2.5,
}: {
  days: Date[]
  filtered: Session[]
  counts: Record<number, Record<string, DayCounts>>
  locations: Location[]
  today: string
  setModal: (v: { session: Session; dateStr: string } | null) => void
  events?: Event[]
  overrides?: CalendarOverride[]
  pxPerMin?: number
}) {
  const PX_PER_MIN = pxPerMin

  function overrideForDate(dateStr: string) {
    return overrides.find(o => {
      const d = o.date instanceof Date ? o.date : new Date(o.date)
      return d.toISOString().split('T')[0] === dateStr
    })
  }
  function periodForDate(dateStr: string) {
    return overrideForDate(dateStr)?.periodType ?? 'REGULAR'
  }

  const relevantSessions = filtered.filter(s => days.some(d => s.dayOfWeek === d.getDay()))
  const allMins = [
    ...relevantSessions.flatMap(s => [parseTime(s.startTime), parseTime(s.endTime)]),
    ...events.flatMap(e => [parseTime(e.startTime), parseTime(e.endTime)]),
  ]
  const rawStart  = allMins.length > 0 ? Math.min(...allMins) : 8 * 60
  const rawEnd    = allMins.length > 0 ? Math.max(...allMins) : 10 * 60
  const gridStart = Math.floor(rawStart / 60) * 60
  const gridEnd   = Math.ceil(rawEnd / 60) * 60
  const gridHeight = (gridEnd - gridStart) * PX_PER_MIN
  const hours = Array.from({ length: (gridEnd - gridStart) / 60 + 1 }, (_, i) => gridStart / 60 + i)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `36px repeat(${days.length}, minmax(0, 1fr))`,
      gap: '0 6px',
    }}>
      {/* Corner */}
      <div />
      {/* Day headers */}
      {days.map(day => {
        const dateStr = toDateStr(day)
        const dow = day.getDay()
        const isToday = dateStr === today
        const ov = overrideForDate(dateStr)
        const ovStyle = ov ? PERIOD_COLORS[ov.periodType] : null
        return (
          <div key={dateStr} className="rounded-xl px-2 py-2 mb-2 text-center"
            style={isToday ? { background: '#0A1628' } : ov ? { background: ovStyle!.bg, border: `1px solid ${ovStyle!.color}30` } : { background: '#F8FAFC' }}>
            <p className="text-xs font-bold uppercase tracking-wide"
              style={{ color: isToday ? 'rgba(255,255,255,0.5)' : ov ? ovStyle!.color : '#94A3B8' }}>
              {DAYS_SHORT[dow]}
            </p>
            <p className="font-black text-base leading-tight"
              style={{ color: isToday ? '#CCFF00' : ov ? ovStyle!.color : '#0A1628' }}>
              {day.getDate()}
            </p>
            {ov && (
              <p className="text-xs font-bold leading-none mt-0.5" style={{ color: ovStyle!.color }}>
                {ovStyle!.label}
              </p>
            )}
          </div>
        )
      })}

      {/* Time ruler */}
      <div style={{ position: 'relative', height: gridHeight }}>
        {hours.map(h => (
          <div key={h} style={{
            position: 'absolute',
            top: (h * 60 - gridStart) * PX_PER_MIN - 7,
            right: 2,
            fontSize: '0.6rem',
            fontWeight: 700,
            color: '#94A3B8',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}>
            {String(h).padStart(2, '0')}:00
          </div>
        ))}
      </div>

      {/* Day columns */}
      {days.map(day => {
        const dateStr = toDateStr(day)
        const dow = day.getDay()
        const period = periodForDate(dateStr)
        const ov = overrideForDate(dateStr)
        const daySessions = filtered.filter(s => s.dayOfWeek === dow && s.periodType === period)
        const laid = layoutSessions(daySessions)
        const dayEvents = events.filter(e => {
          const d = e.date instanceof Date ? e.date : new Date(e.date)
          return d.toISOString().split('T')[0] === dateStr
        })

        return (
          <div key={dateStr} style={{ position: 'relative', height: gridHeight }}>
            {/* Hour lines */}
            {hours.map(h => (
              <div key={h} style={{
                position: 'absolute',
                top: (h * 60 - gridStart) * PX_PER_MIN,
                left: 0, right: 0,
                borderTop: '1px dashed #E2E8F0',
                pointerEvents: 'none',
              }} />
            ))}

            {/* Session cards */}
            {laid.map(({ session: s, col, numCols }) => {
              const startMins = parseTime(s.startTime)
              const endMins   = parseTime(s.endTime)
              const top    = (startMins - gridStart) * PX_PER_MIN
              const height = Math.max((endMins - startMins) * PX_PER_MIN - 4, 36)
              const locColor = getLocationColor(s.location.id, locations)
              return (
                <div key={s.id} style={{
                  position: 'absolute',
                  top, height,
                  left: `${(col / numCols) * 100}%`,
                  width: `${100 / numCols}%`,
                  paddingRight: col < numCols - 1 ? 4 : 0,
                }}>
                  <SessionCard session={s} dateStr={dateStr} counts={counts}
                    locColor={locColor}
                    compact={height < 60}
                    onClick={() => setModal({ session: s, dateStr })} />
                </div>
              )
            })}

            {/* Event cards */}
            {dayEvents.map(e => {
              const startMins = parseTime(e.startTime)
              const endMins   = parseTime(e.endTime)
              const top    = (startMins - gridStart) * PX_PER_MIN
              const height = Math.max((endMins - startMins) * PX_PER_MIN - 4, 28)
              return (
                <div key={`ev-${e.id}`} style={{
                  position: 'absolute', top, height,
                  left: 0, right: 0,
                  background: '#FFF7ED', border: '1px solid #FED7AA',
                  borderRadius: 8, padding: '2px 6px', overflow: 'hidden',
                }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#C2410C', lineHeight: 1.2 }}>★ {e.name}</p>
                  {height >= 40 && (
                    <p style={{ fontSize: '0.6rem', fontWeight: 600, color: '#9A3412' }}>{e.startTime}–{e.endTime}</p>
                  )}
                </div>
              )
            })}

            {daySessions.length === 0 && dayEvents.length === 0 && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 8,
                background: 'repeating-linear-gradient(45deg, #F8FAFC 0px, #F8FAFC 4px, #F1F5F9 4px, #F1F5F9 8px)',
                opacity: 0.6,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Day view ─────────────────────────────────────────────────
function DayView({
  sessions, locations, counts, dateStr, locFilter, events, overrides,
}: {
  sessions: Session[]
  locations: Location[]
  counts: Record<number, Record<string, DayCounts>>
  dateStr: string
  locFilter: number | 'all'
  events: Event[]
  overrides: CalendarOverride[]
}) {
  const [modal, setModal] = useState<Session | null>(null)
  const date = new Date(dateStr)
  const dow = date.getDay()

  const ov = overrides.find(o => {
    const d = o.date instanceof Date ? o.date : new Date(o.date)
    return d.toISOString().split('T')[0] === dateStr
  })
  const period = ov?.periodType ?? 'REGULAR'

  const filtered = sessions.filter(s =>
    s.dayOfWeek === dow && s.periodType === period && (locFilter === 'all' || s.location.id === locFilter)
  )
  const dayEvents = events.filter(e => {
    const d = e.date instanceof Date ? e.date : new Date(e.date)
    return d.toISOString().split('T')[0] === dateStr && (locFilter === 'all' || e.location.id === locFilter)
  })

  if (filtered.length === 0 && dayEvents.length === 0) {
    return (
      <>
        {ov && (
          <div className="rounded-xl px-4 py-2.5 flex items-center gap-2"
            style={{ background: PERIOD_COLORS[ov.periodType]?.bg, border: `1px solid ${PERIOD_COLORS[ov.periodType]?.color}30` }}>
            <span className="text-xs font-bold" style={{ color: PERIOD_COLORS[ov.periodType]?.color }}>
              {PERIOD_COLORS[ov.periodType]?.label}
              {ov.note ? ` — ${ov.note}` : ''}
            </span>
          </div>
        )}
        <div className="card p-10 text-center">
          <p className="font-semibold" style={{ color: '#94A3B8' }}>No sessions this day</p>
        </div>
      </>
    )
  }

  return (
    <>
      {ov && (
        <div className="rounded-xl px-4 py-2.5 flex items-center gap-2"
          style={{ background: PERIOD_COLORS[ov.periodType]?.bg, border: `1px solid ${PERIOD_COLORS[ov.periodType]?.color}30` }}>
          <span className="text-xs font-bold" style={{ color: PERIOD_COLORS[ov.periodType]?.color }}>
            {PERIOD_COLORS[ov.periodType]?.label}
            {ov.note ? ` — ${ov.note}` : ''}
          </span>
        </div>
      )}
      <div className="space-y-3">
        {dayEvents.map(e => (
          <div key={`ev-${e.id}`}
            className="w-full text-left rounded-2xl overflow-hidden"
            style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#FED7AA', color: '#C2410C' }}>★ Événement</span>
                </div>
                <p className="font-display font-semibold text-base leading-tight" style={{ color: '#C2410C' }}>{e.name}</p>
                <p className="text-sm font-semibold mt-0.5 flex items-center gap-1.5" style={{ color: '#9A3412' }}>
                  <Clock size={12} />{e.startTime} – {e.endTime}
                  <span className="mx-1">·</span>
                  {e.location.name}
                </p>
                {e.description && <p className="text-xs mt-1" style={{ color: '#92400E' }}>{e.description}</p>}
              </div>
              {e.maxCapacity && (
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold" style={{ color: '#C2410C' }}>max {e.maxCapacity}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.map(s => {
          const locColor = getLocationColor(s.location.id, locations)
          const c = counts[s.id]?.[dateStr]
          return (
            <button key={s.id} onClick={() => setModal(s)}
              className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-98 hover:shadow-md"
              style={{ background: c && c.total > 0 ? locColor : `${locColor}18` }}>
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Left: session info */}
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-base leading-tight"
                    style={{ color: c && c.total > 0 ? '#fff' : locColor }}>
                    {s.name}
                  </p>
                  <p className="text-sm font-semibold mt-0.5 flex items-center gap-1.5"
                    style={{ color: c && c.total > 0 ? 'rgba(255,255,255,0.7)' : `${locColor}99` }}>
                    <Clock size={12} />{s.startTime} – {s.endTime}
                    <span className="mx-1">·</span>
                    {s.location.name}
                  </p>
                </div>
                {/* Right: stats */}
                {c && c.total > 0 ? (
                  <div className="text-right shrink-0 space-y-1">
                    <p className="font-black text-2xl leading-none" style={{ color: '#fff' }}>{c.total}</p>
                    <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>kids</p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <span className="flex items-center gap-0.5 text-xs font-bold"
                        style={{ color: coachesNeeded(c.total) >= 2 ? '#FFD700' : 'rgba(255,255,255,0.65)' }}>
                        <User size={11} />{coachesNeeded(c.total)}
                      </span>
                      {c.meals > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: '#FFD700' }}>
                          <Utensils size={11} />{c.meals}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-semibold shrink-0" style={{ color: locColor }}>Empty</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
      {modal && <BookingModal session={modal} dateStr={dateStr} onClose={() => setModal(null)} />}
    </>
  )
}

const PERIOD_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  VACATION: { bg: '#EFF6FF', color: '#2563EB', label: 'Vacances' },
  SPECIAL:  { bg: '#FFF7ED', color: '#C2410C', label: 'Spécial'  },
}

// ── Main component ───────────────────────────────────────────
export default function ScheduleView({
  sessions, locations, counts, events, overrides, initialView, initialRef,
}: {
  sessions: Session[]
  locations: Location[]
  counts: Record<number, Record<string, DayCounts>>
  events: Event[]
  overrides: CalendarOverride[]
  initialView: 'day' | 'week' | 'month'
  initialRef: string
}) {
  const router = useRouter()
  const [view, setView]     = useState<'day' | 'week' | 'month'>(initialView)
  const [refStr, setRefStr] = useState(initialRef)
  const [locFilter, setLocFilter] = useState<number | 'all'>('all')
  const [modal, setModal]   = useState<{ session: Session; dateStr: string } | null>(null)

  const ref = new Date(refStr)

  function eventsForDate(dateStr: string) {
    return events.filter(e => {
      const d = e.date instanceof Date ? e.date : new Date(e.date)
      return d.toISOString().split('T')[0] === dateStr
    })
  }

  // Returns the effective period type for a date (override wins over REGULAR)
  function periodForDate(dateStr: string): string {
    const ov = overrides.find(o => {
      const d = o.date instanceof Date ? o.date : new Date(o.date)
      return d.toISOString().split('T')[0] === dateStr
    })
    return ov ? ov.periodType : 'REGULAR'
  }

  function overrideForDate(dateStr: string): CalendarOverride | undefined {
    return overrides.find(o => {
      const d = o.date instanceof Date ? o.date : new Date(o.date)
      return d.toISOString().split('T')[0] === dateStr
    })
  }

  // Filter sessions for a date: use the date's period type
  function sessionsForDate(dateStr: string, dowSessions: Session[]): Session[] {
    const period = periodForDate(dateStr)
    return dowSessions.filter(s => s.periodType === period || (period === 'REGULAR' && s.periodType === 'REGULAR'))
  }

  function navigate(delta: number) {
    const d = new Date(ref)
    if (view === 'day')   d.setDate(d.getDate() + delta)
    else if (view === 'week')  d.setDate(d.getDate() + delta * 7)
    else d.setMonth(d.getMonth() + delta)
    const next = toDateStr(d)
    setRefStr(next)
    router.push(`/admin/schedule?view=${view}&ref=${next}`, { scroll: false })
  }

  function switchView(v: 'day' | 'week' | 'month') {
    setView(v)
    router.push(`/admin/schedule?view=${v}&ref=${refStr}`, { scroll: false })
  }

  function goToday() {
    const today = toDateStr(new Date())
    setRefStr(today)
    router.push(`/admin/schedule?view=${view}&ref=${today}`, { scroll: false })
  }

  const filtered = sessions.filter(s => locFilter === 'all' || s.location.id === locFilter)
  const today = toDateStr(new Date())

  // ── Label ───────────────────────────────────────────────────
  const label = (() => {
    if (view === 'day') {
      return ref.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
    if (view === 'week') {
      const monday = mondayOf(ref)
      const sunday = addDays(monday, 6)
      if (monday.getMonth() === sunday.getMonth()) return `${MONTHS[monday.getMonth()]} ${monday.getFullYear()}`
      return `${MONTHS[monday.getMonth()]} – ${MONTHS[sunday.getMonth()]} ${sunday.getFullYear()}`
    }
    return `${MONTHS[ref.getMonth()]} ${ref.getFullYear()}`
  })()

  return (
    <div className="space-y-4">
      <Controls
        label={label} view={view} onSwitchView={switchView}
        onPrev={() => navigate(-1)} onNext={() => navigate(1)} onToday={goToday}
      />

      {/* ── LOCATION FILTER (day + month views) ── */}
      {view !== 'week' && (
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setLocFilter('all')}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={locFilter === 'all' ? { background: '#0A1628', color: '#CCFF00' } : { background: '#F1F5F9', color: '#64748B' }}>
            All
          </button>
          {locations.map((loc, i) => {
            const col = LOCATION_COLORS[i % LOCATION_COLORS.length]
            return (
              <button key={loc.id} onClick={() => setLocFilter(loc.id)}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                style={locFilter === loc.id ? { background: col, color: '#fff' } : { background: `${col}15`, color: col }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col }} />
                {loc.name}
              </button>
            )
          })}
        </div>
      )}

      {/* ── DAY VIEW ── */}
      {view === 'day' && (
        <DayView sessions={sessions} locations={locations} counts={counts} events={events} overrides={overrides} dateStr={refStr} locFilter={locFilter} />
      )}

      {/* ── WEEK VIEW (split weekday / weekend time grids) ── */}
      {view === 'week' && (() => {
        const monday = mondayOf(ref)
        const allDays  = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
        const weekdays = allDays.filter(d => { const dow = d.getDay(); return dow >= 1 && dow <= 5 })
        const weekend  = allDays.filter(d => { const dow = d.getDay(); return dow === 6 || dow === 0 })

        const hasWeekdaySessions = filtered.some(s => s.dayOfWeek !== null && s.dayOfWeek >= 1 && s.dayOfWeek <= 5)
        const hasWeekendSessions = filtered.some(s => s.dayOfWeek === 6 || s.dayOfWeek === 0)

        return (
          <div className="flex flex-col gap-8">

            {/* Weekdays panel */}
            {hasWeekdaySessions && (
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
                    Lundi – Vendredi
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setLocFilter('all')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={locFilter === 'all' ? { background: '#0A1628', color: '#CCFF00' } : { background: '#F1F5F9', color: '#64748B' }}>
                      All locations
                    </button>
                    {locations.map((loc, i) => {
                      const col = LOCATION_COLORS[i % LOCATION_COLORS.length]
                      return (
                        <button key={loc.id} onClick={() => setLocFilter(loc.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          style={locFilter === loc.id ? { background: col, color: '#fff' } : { background: `${col}15`, color: col }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: col }} />
                          {loc.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <TimeGrid
                  days={weekdays} filtered={filtered} counts={counts}
                  locations={locations} today={today} setModal={setModal}
                  events={events} overrides={overrides}
                  pxPerMin={2.5}
                />
              </div>
            )}

            {/* Weekend panel — compact */}
            {hasWeekendSessions && (
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
                    Samedi – Dimanche
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setLocFilter('all')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={locFilter === 'all' ? { background: '#0A1628', color: '#CCFF00' } : { background: '#F1F5F9', color: '#64748B' }}>
                      All locations
                    </button>
                    {locations.map((loc, i) => {
                      const col = LOCATION_COLORS[i % LOCATION_COLORS.length]
                      return (
                        <button key={loc.id} onClick={() => setLocFilter(loc.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          style={locFilter === loc.id ? { background: col, color: '#fff' } : { background: `${col}15`, color: col }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: col }} />
                          {loc.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <TimeGrid
                  days={weekend} filtered={filtered} counts={counts}
                  locations={locations} today={today} setModal={setModal}
                  events={events} overrides={overrides}
                  pxPerMin={1.4}
                />
              </div>
            )}

            {!hasWeekdaySessions && !hasWeekendSessions && (
              <div className="card p-10 text-center">
                <p className="font-semibold" style={{ color: '#94A3B8' }}>Aucune session cette semaine</p>
              </div>
            )}
          </div>
        )
      })()}

      {/* ── MONTH VIEW ── */}
      {view === 'month' && (() => {
        const year  = ref.getFullYear()
        const month = ref.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay  = new Date(year, month + 1, 0)
        const startDow = firstDay.getDay()
        const offset   = startDow === 0 ? 6 : startDow - 1
        const totalCells = Math.ceil((offset + lastDay.getDate()) / 7) * 7

        const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i - offset + 1
          if (dayNum < 1 || dayNum > lastDay.getDate()) return null
          return new Date(year, month, dayNum)
        })

        return (
          <div className="space-y-2">
            <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, minmax(0,1fr))' }}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <p key={d} className="text-center text-xs font-bold uppercase tracking-wide py-1" style={{ color: '#94A3B8' }}>{d}</p>
              ))}
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} className="rounded-xl" style={{ minHeight: '80px', background: '#F8FAFC' }} />
                const dateStr = toDateStr(day)
                const dow = day.getDay()
                const isToday = dateStr === today
                const ov = overrideForDate(dateStr)
                const period = ov?.periodType ?? 'REGULAR'
                const ovStyle = ov ? PERIOD_COLORS[ov.periodType] : null
                const daySessions = filtered.filter(s => s.dayOfWeek === dow && s.periodType === period)
                const dayEvents   = eventsForDate(dateStr)
                const totalBookings = daySessions.reduce((sum, s) => sum + (counts[s.id]?.[dateStr]?.total ?? 0), 0)
                const totalMeals   = daySessions.reduce((sum, s) => sum + (counts[s.id]?.[dateStr]?.meals ?? 0), 0)
                const totalCoaches = daySessions.reduce((sum, s) => sum + coachesNeeded(counts[s.id]?.[dateStr]?.total ?? 0), 0)

                return (
                  <div key={dateStr} className="rounded-xl p-2 flex flex-col gap-1 cursor-pointer"
                    onClick={() => { switchView('day'); setRefStr(dateStr); router.push(`/admin/schedule?view=day&ref=${dateStr}`, { scroll: false }) }}
                    style={{
                      minHeight: '80px',
                      background: isToday ? '#0A1628' : ov ? ovStyle!.bg : '#F8FAFC',
                      border: isToday ? 'none' : ov ? `1px solid ${ovStyle!.color}40` : '1px solid #E2E8F0',
                    }}>
                    <p className="text-xs font-black leading-none"
                      style={{ color: isToday ? '#CCFF00' : ov ? ovStyle!.color : '#0A1628' }}>
                      {day.getDate()}
                    </p>
                    {ov && !isToday && (
                      <p className="text-xs font-bold leading-none" style={{ color: ovStyle!.color, fontSize: '0.55rem' }}>
                        {ovStyle!.label}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {daySessions.map(s => {
                        const locColor = getLocationColor(s.location.id, locations)
                        const c = counts[s.id]?.[dateStr]
                        return (
                          <div key={s.id} className="rounded-md px-1 py-0.5 text-xs font-bold leading-tight"
                            style={{ background: `${locColor}25`, color: locColor }}>
                            {c?.total ?? 0}
                          </div>
                        )
                      })}
                      {dayEvents.map(e => (
                        <div key={`ev-${e.id}`} className="rounded-md px-1 py-0.5 text-xs font-bold leading-tight"
                          style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}
                          title={e.name}>
                          ★
                        </div>
                      ))}
                    </div>
                    {totalBookings > 0 && (
                      <div className="mt-auto space-y-0.5">
                        <p className="text-xs font-semibold" style={{ color: isToday ? 'rgba(255,255,255,0.4)' : '#94A3B8' }}>
                          {totalBookings} kid{totalBookings !== 1 ? 's' : ''}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold flex items-center gap-0.5"
                            style={{ color: totalCoaches >= 2 ? '#EF4444' : isToday ? 'rgba(255,255,255,0.35)' : '#94A3B8' }}>
                            <User size={9} />{totalCoaches}
                          </p>
                          {totalMeals > 0 && (
                            <p className="text-xs font-bold flex items-center gap-0.5" style={{ color: '#F59E0B' }}>
                              <Utensils size={9} />{totalMeals}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 pt-1 flex-wrap">
              {locations.map((loc, i) => (
                <div key={loc.id} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: LOCATION_COLORS[i % LOCATION_COLORS.length] }} />
                  <span className="text-xs font-semibold" style={{ color: '#64748B' }}>{loc.name}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <User size={11} style={{ color: '#EF4444' }} />
                <span className="text-xs font-semibold" style={{ color: '#64748B' }}>Coaches (red = ≥2)</span>
              </div>
              <span className="text-xs font-semibold ml-auto" style={{ color: '#CBD5E1' }}>Tap day → day view</span>
            </div>
          </div>
        )
      })()}

      {/* Modal */}
      {modal && (
        <BookingModal session={modal.session} dateStr={modal.dateStr} onClose={() => setModal(null)} />
      )}
    </div>
  )
}

// ── Controls ─────────────────────────────────────────────────
function Controls({
  label, view, onSwitchView, onPrev, onNext, onToday,
}: {
  label: string
  view: 'day' | 'week' | 'month'
  onSwitchView: (v: 'day' | 'week' | 'month') => void
  onPrev: () => void; onNext: () => void; onToday: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: '#E2E8F0' }}>
        {(['day', 'week', 'month'] as const).map(v => (
          <button key={v} onClick={() => onSwitchView(v)}
            className="px-3 py-2 text-sm font-bold transition-colors capitalize"
            style={view === v ? { background: '#0A1628', color: '#CCFF00' } : { background: '#fff', color: '#64748B' }}>
            {v}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <button onClick={onPrev} className="btn btn-secondary p-2"><ChevronLeft size={16} /></button>
        <button onClick={onToday} className="btn btn-secondary px-3 text-xs font-bold">Today</button>
        <button onClick={onNext} className="btn btn-secondary p-2"><ChevronRight size={16} /></button>
      </div>

      <p className="font-display font-semibold text-sm" style={{ color: '#0A1628' }}>{label}</p>
    </div>
  )
}
