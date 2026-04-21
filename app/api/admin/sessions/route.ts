import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function auth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ninja_staff_token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function GET() {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessions = await prisma.session.findMany({
    orderBy: [{ locationId: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
    include: { location: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ sessions })
}

export async function POST(req: NextRequest) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { locationId, name, sessionType, creditType, dayOfWeek, startTime, endTime, includeLunch, periodType, maxCapacity } = body

  if (!locationId || !name || !sessionType || !creditType || !startTime || !endTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const session = await prisma.session.create({
    data: {
      locationId: parseInt(locationId),
      name,
      sessionType,
      creditType,
      dayOfWeek: dayOfWeek != null ? parseInt(dayOfWeek) : null,
      startTime,
      endTime,
      includeLunch: includeLunch ?? false,
      periodType: periodType ?? 'REGULAR',
      maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
      active: true,
    },
    include: { location: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ session }, { status: 201 })
}
