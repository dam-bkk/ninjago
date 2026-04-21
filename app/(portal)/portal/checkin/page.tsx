import { getParentFromCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import CheckInClient from './CheckInClient'

export default async function CheckInPage() {
  const parent = await getParentFromCookie()
  if (!parent) redirect('/login')

  // Get all active sessions for student locations
  const locationIds = parent.students.flatMap(s =>
    s.locations.map(l => l.location.id)
  )
  const sessions = await prisma.session.findMany({
    where: { active: true, locationId: { in: locationIds } },
    orderBy: [{ locationId: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
    include: { location: { select: { id: true, name: true } } },
  })

  return (
    <CheckInClient
      parent={parent}
      sessions={sessions}
    />
  )
}
