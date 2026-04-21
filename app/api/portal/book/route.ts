import { NextRequest, NextResponse } from 'next/server'
import { getParentFromCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const parent = await getParentFromCookie()
  if (!parent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { studentId, sessionId, locationId, date } = await req.json()

  const student = parent.students.find(s => s.id === studentId)
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 403 })

  const dateObj = new Date(date)

  const existing = await prisma.reservation.findFirst({
    where: { studentId, sessionId, date: dateObj },
  })
  if (existing) return NextResponse.json({ error: 'Already booked for this session' }, { status: 409 })

  const [reservation, session, settings] = await Promise.all([
    prisma.reservation.create({
      data: { studentId, sessionId, locationId, date: dateObj, status: 'EXPECTED' },
    }),
    prisma.session.findUnique({
      where: { id: sessionId },
      include: { location: true },
    }),
    prisma.settings.findUnique({ where: { id: 1 } }),
  ])

  // Notify manager via WhatsApp deep-link (fire-and-forget)
  // We store the notification URL in the response so the client can optionally open it,
  // but we also log it server-side for traceability.
  if (settings?.whatsappNumber && session) {
    const dateLabel = dateObj.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    const msg = encodeURIComponent(
      `📅 New booking!\n` +
      `Student: ${student.name}\n` +
      `Session: ${session.name} — ${session.startTime}–${session.endTime}\n` +
      `Date: ${dateLabel}\n` +
      `Location: ${session.location.name}`
    )
    const waUrl = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${msg}`
    // Return URL so the PWA can optionally trigger it
    return NextResponse.json({ reservationId: reservation.id, notifyUrl: waUrl })
  }

  return NextResponse.json({ reservationId: reservation.id })
}
