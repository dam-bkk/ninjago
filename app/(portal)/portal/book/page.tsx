import { redirect } from 'next/navigation'
import { getParentFromCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import BookClient from './BookClient'

export default async function BookPage() {
  const parent = await getParentFromCookie()
  if (!parent) redirect('/login')

  const students = parent.students
  if (students.length === 0) redirect('/portal')

  // Get sessions for the student's locations
  const locationIds = [...new Set(students.flatMap(s => s.locations.map(l => l.location.id)))]

  const sessions = await prisma.session.findMany({
    where: {
      active: true,
      locationId: { in: locationIds.length > 0 ? locationIds : [0] },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    include: { location: true },
  })

  return (
    <div className="max-w-md mx-auto px-5 pt-8 space-y-5">
      <div>
        <h1 className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>
          Book a session
        </h1>
        <p className="text-sm font-semibold mt-0.5" style={{ color: 'rgba(10,22,40,0.50)' }}>
          Select a session and date
        </p>
      </div>
      <BookClient sessions={sessions} students={students} />
    </div>
  )
}
