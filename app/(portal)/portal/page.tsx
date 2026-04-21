import { redirect } from 'next/navigation'
import { getParentFromCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PortalHome from './PortalHome'

export default async function PortalPage() {
  const parent = await getParentFromCookie()
  if (!parent) redirect('/login')

  const now = new Date()
  const in60days = new Date(now); in60days.setDate(now.getDate() + 60)

  const events = await prisma.event.findMany({
    where: {
      active: true,
      date: { gte: now, lte: in60days },
    },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      name: true,
      date: true,
      startTime: true,
      endTime: true,
      description: true,
      creditType: true,
      sessionType: true,
      location: { select: { name: true } },
    },
    take: 6,
  })

  return <PortalHome parent={parent} events={events} />
}
