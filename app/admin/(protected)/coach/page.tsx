import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import CoachView from './CoachView'

export default async function CoachPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ninja_staff_token')?.value!
  const staff = await verifyToken(token)

  const [locations, students] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: 'asc' } }),
    prisma.student.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, age: true },
    }),
  ])

  return <CoachView locations={locations} students={students} staffId={staff!.id} />
}
