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

  const slots = await prisma.birthdaySlot.findMany({
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    include: { location: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ slots })
}

export async function POST(req: NextRequest) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { locationId, date, startTime, endTime, maxParties } = body

  if (!date || !startTime || !endTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const slot = await prisma.birthdaySlot.create({
    data: {
      locationId: locationId ? parseInt(locationId) : null,
      date: new Date(date),
      startTime,
      endTime,
      maxParties: maxParties ? parseInt(maxParties) : 1,
      booked: false,
    },
    include: { location: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ slot }, { status: 201 })
}
