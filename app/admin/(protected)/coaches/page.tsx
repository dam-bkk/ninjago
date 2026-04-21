import { prisma } from '@/lib/prisma'
import CoachesClient from './CoachesClient'

export default async function CoachesPage() {
  const [coaches, locations] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ['COACH', 'ADMIN', 'SUPER_ADMIN'] } },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, locationId: true, active: true,
        location: { select: { id: true, name: true } },
      },
    }),
    prisma.location.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, qrToken: true },
    }),
  ])

  return <CoachesClient initialCoaches={coaches} locations={locations} />
}
