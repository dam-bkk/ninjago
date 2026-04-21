import { prisma } from '@/lib/prisma'
import ScheduleSettingsClient from './ScheduleSettingsClient'

export default async function ScheduleSettingsPage() {
  const [sessions, locations, overrides] = await Promise.all([
    prisma.session.findMany({
      orderBy: [{ locationId: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: { location: { select: { id: true, name: true } } },
    }),
    prisma.location.findMany({ orderBy: { id: 'asc' } }),
    prisma.calendarOverride.findMany({ orderBy: { date: 'asc' } }),
  ])

  return <ScheduleSettingsClient initialSessions={sessions} locations={locations} initialOverrides={overrides} />
}
