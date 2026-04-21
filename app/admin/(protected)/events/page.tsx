import { prisma } from '@/lib/prisma'
import EventsClient from './EventsClient'

export default async function EventsPage() {
  const [events, locations] = await Promise.all([
    prisma.event.findMany({
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: { location: { select: { id: true, name: true } } },
    }),
    prisma.location.findMany({ orderBy: { id: 'asc' } }),
  ])

  return <EventsClient initialEvents={events} locations={locations} />
}
