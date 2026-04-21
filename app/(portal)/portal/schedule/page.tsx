import { redirect } from 'next/navigation'
import { getParentFromCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ScheduleClient from './ScheduleClient'

export default async function PortalSchedulePage() {
  const parent = await getParentFromCookie()
  if (!parent) redirect('/login')

  const locationIds = [...new Set(parent.students.flatMap(s => s.locations.map(l => l.location.id)))]

  const now = new Date()
  const in6Weeks = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000)

  const [sessions, reservationCounts] = await Promise.all([
    prisma.session.findMany({
      where: {
        active: true,
        ...(locationIds.length > 0 ? { locationId: { in: locationIds } } : {}),
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: { location: true },
    }),
    // Count upcoming reservations per session (next 6 weeks)
    prisma.reservation.groupBy({
      by: ['sessionId'],
      where: {
        date: { gte: now, lte: in6Weeks },
        status: { not: 'CANCELLED' },
      },
      _count: { sessionId: true },
    }),
  ])

  const countMap: Record<number, number> = {}
  for (const r of reservationCounts) {
    countMap[r.sessionId] = r._count.sessionId
  }

  const sessionsWithCount = sessions.map(s => ({
    ...s,
    _bookingCount: countMap[s.id] ?? 0,
  }))

  return (
    <div className="max-w-md mx-auto px-5 pt-8 space-y-5">
      <h1 className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>
        Schedule
      </h1>
      <ScheduleClient sessions={sessionsWithCount} />
    </div>
  )
}
