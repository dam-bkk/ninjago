import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const slots = await prisma.birthdaySlot.findMany({
    where: {
      date: { gte: today },
      booked: false,
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      locationId: true,
      location: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({ slots })
}
