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

export async function GET(req: NextRequest) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  const events = await prisma.event.findMany({
    where: {
      active: true,
      ...(from && to ? { date: { gte: new Date(from), lt: new Date(to) } } : {}),
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    include: { location: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ events })
}

export async function POST(req: NextRequest) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { locationId, name, sessionType, creditType, date, startTime, endTime, maxCapacity, description } = body

  if (!locationId || !name || !sessionType || !date || !startTime || !endTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const event = await prisma.event.create({
    data: {
      locationId: parseInt(locationId),
      name,
      sessionType,
      creditType: creditType || null,
      date: new Date(date),
      startTime,
      endTime,
      maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
      description: description || null,
      active: true,
    },
    include: { location: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ event }, { status: 201 })
}
