import { prisma } from '@/lib/prisma'
import ScheduleView from './ScheduleView'

type SearchParams = { view?: string; ref?: string }

export default async function SchedulePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const view = sp.view === 'month' ? 'month' : 'week'
  const ref  = sp.ref ? new Date(sp.ref) : new Date()

  // Compute date range
  let from: Date, to: Date
  if (view === 'week') {
    // Mon of the week containing ref
    const day = ref.getDay()
    const diff = (day === 0 ? -6 : 1 - day)
    from = new Date(ref); from.setDate(ref.getDate() + diff); from.setHours(0,0,0,0)
    to   = new Date(from); to.setDate(from.getDate() + 7)
  } else {
    from = new Date(ref.getFullYear(), ref.getMonth(), 1)
    to   = new Date(ref.getFullYear(), ref.getMonth() + 1, 1)
  }

  const [sessions, locations, reservations, events, overrides] = await Promise.all([
    prisma.session.findMany({
      where: { active: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: { location: true },
    }),
    prisma.location.findMany({ orderBy: { name: 'asc' } }),
    prisma.reservation.findMany({
      where: {
        date: { gte: from, lt: to },
        status: { not: 'CANCELLED' },
      },
      include: {
        attendance: { select: { id: true, lunch: true } },
      },
    }),
    prisma.event.findMany({
      where: { active: true, date: { gte: from, lt: to } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: { location: { select: { id: true, name: true } } },
    }),
    prisma.calendarOverride.findMany({
      where: { date: { gte: from, lt: to } },
      orderBy: { date: 'asc' },
    }),
  ])

  // Build a map: sessionId → dateStr → { total, meals }
  type DayCounts = { total: number; meals: number }
  const counts: Record<number, Record<string, DayCounts>> = {}
  for (const r of reservations) {
    const dateStr = r.date instanceof Date
      ? r.date.toISOString().split('T')[0]
      : new Date(r.date).toISOString().split('T')[0]
    if (!counts[r.sessionId]) counts[r.sessionId] = {}
    if (!counts[r.sessionId][dateStr]) counts[r.sessionId][dateStr] = { total: 0, meals: 0 }
    counts[r.sessionId][dateStr].total++
    if (r.attendance?.lunch) counts[r.sessionId][dateStr].meals++
  }

  return (
    <div className="p-4 sm:p-8 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>Schedule</h1>
        <div className="flex items-center gap-2">
          <a
            href="/admin/events"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
            style={{ borderColor: '#E2E8F0', color: '#475569' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
            Events
          </a>
          <a
            href="/admin/schedule/trombinoscope"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
            style={{ borderColor: '#E2E8F0', color: '#475569' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="17" cy="11" r="3"/><path d="M21 21v-1a3 3 0 0 0-3-3h-1"/>
            </svg>
            Roster
          </a>
          <a
            href="/admin/schedule/settings"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
            style={{ borderColor: '#E2E8F0', color: '#475569' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Sessions
          </a>
        </div>
      </div>
      <ScheduleView
        sessions={sessions}
        locations={locations}
        counts={counts}
        events={events}
        overrides={overrides}
        initialView={view}
        initialRef={ref.toISOString().split('T')[0]}
      />
    </div>
  )
}
