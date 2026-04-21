import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import StudentsClient from './StudentsClient'

export default async function StudentsPage() {
  const now = new Date()
  const students = await prisma.student.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      age: true,
      birthdate: true,
      parent: { select: { phone: true, name: true } },
      locations: { select: { location: { select: { name: true } } } },
      packages: {
        where: { package: { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } },
        select: { package: { select: { creditType: true, totalCredits: true, usedCredits: true } } },
      },
    },
  })

  // Serialise dates for the client component
  const serialised = students.map(s => ({
    ...s,
    birthdate: s.birthdate?.toISOString() ?? null,
  }))

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>Students</h1>
          <p className="text-sm font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
            {students.length} active
          </p>
        </div>
        <Link href="/admin/students/new" className="btn btn-primary">+ Add student</Link>
      </div>

      <StudentsClient students={serialised} />
    </div>
  )
}
