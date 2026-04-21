import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('ninja_staff_token')?.value
  if (!token || !await verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sessionId = req.nextUrl.searchParams.get('sessionId')
  const dateStr   = req.nextUrl.searchParams.get('date')
  if (!sessionId || !dateStr) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const date = new Date(dateStr)

  const reservations = await prisma.reservation.findMany({
    where: { sessionId: parseInt(sessionId), date, status: { not: 'CANCELLED' } },
    orderBy: [{ student: { name: 'asc' } }],
    include: {
      student: { select: { id: true, name: true, age: true } },
      attendance: { select: { id: true, lunch: true, checkedInAt: true } },
    },
  })

  return NextResponse.json({ reservations })
}
