import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('ninja_staff_token')?.value
  const staff = token ? await verifyToken(token) : null
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const locationId = req.nextUrl.searchParams.get('locationId')
  const dateStr = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  const date = new Date(dateStr)
  const dayOfWeek = date.getDay()

  const where: Record<string, unknown> = { dayOfWeek, active: true }
  if (locationId) where.locationId = parseInt(locationId)

  const sessions = await prisma.session.findMany({
    where,
    orderBy: { startTime: 'asc' },
    include: {
      location: true,
      reservations: {
        where: { date },
        include: {
          student: {
            include: {
              packages: {
                where: {
                  package: {
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                  },
                },
                include: { package: { select: { creditType: true, totalCredits: true, usedCredits: true } } },
              },
            },
          },
          attendance: true,
        },
      },
    },
  })

  return NextResponse.json({ sessions, date: dateStr })
}
