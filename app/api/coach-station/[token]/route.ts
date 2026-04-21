import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function resolveLocation(token: string) {
  return prisma.location.findUnique({ where: { qrToken: token } })
}

// GET /api/coach-station/[token]?date=YYYY-MM-DD
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const location = await resolveLocation(token)
  if (!location) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

  const dateStr = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  const date = new Date(dateStr)
  const dayOfWeek = date.getDay()

  const sessions = await prisma.session.findMany({
    where: { locationId: location.id, dayOfWeek, active: true },
    orderBy: { startTime: 'asc' },
    include: {
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

  // Also return all active students for "add student" feature
  const students = await prisma.student.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, age: true },
  })

  return NextResponse.json({ location: { id: location.id, name: location.name }, sessions, students, date: dateStr })
}

// POST /api/coach-station/[token] — check-in a student
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const location = await resolveLocation(token)
  if (!location) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

  const { studentId, sessionId, date, isDropIn, dropInAmount, dropInMethod, lunch } = await req.json()
  const dateObj = new Date(date)

  // Check not already checked in
  const existing = await prisma.attendance.findFirst({
    where: { studentId, date: dateObj, locationId: location.id },
  })
  if (existing) return NextResponse.json({ error: 'Already checked in' }, { status: 409 })

  // Find or create reservation
  let reservationId: number | null = null
  if (sessionId) {
    const res = await prisma.reservation.upsert({
      where: { id: -1 },
      update: {},
      create: { studentId, sessionId, locationId: location.id, date: dateObj, status: 'CHECKED_IN' },
    }).catch(async () => {
      return prisma.reservation.findFirst({ where: { studentId, sessionId, date: dateObj } })
    })
    if (res) {
      reservationId = res.id
      await prisma.reservation.update({ where: { id: res.id }, data: { status: 'CHECKED_IN' } }).catch(() => {})
    }
  }

  // Deduct credit if not drop-in
  let packageId: number | null = null
  let balanceAfter = 0

  if (!isDropIn && sessionId) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } })
    if (session) {
      const studentPkgs = await prisma.studentPackage.findMany({
        where: { studentId },
        include: { package: true },
      })
      const eligible = studentPkgs
        .filter(sp =>
          sp.package.creditType === session.creditType &&
          sp.package.usedCredits < sp.package.totalCredits &&
          (!sp.package.expiresAt || sp.package.expiresAt > new Date())
        )
        .sort((a, b) => (a.package.expiresAt?.getTime() ?? Infinity) - (b.package.expiresAt?.getTime() ?? Infinity))

      if (eligible.length > 0) {
        const pkg = eligible[0].package
        packageId = pkg.id
        balanceAfter = pkg.totalCredits - pkg.usedCredits - 1
        await prisma.package.update({ where: { id: pkg.id }, data: { usedCredits: { increment: 1 } } })
      }
    }
  }

  // Create attendance (no coachId since no auth)
  const attendance = await prisma.attendance.create({
    data: {
      studentId,
      locationId: location.id,
      date: dateObj,
      reservationId,
      lunch: lunch ?? false,
      isDropIn: isDropIn ?? false,
    },
  })

  // Ledger entry
  if (packageId !== null && !isDropIn) {
    await prisma.ledgerEntry.create({
      data: { studentId, packageId, attendanceId: attendance.id, creditsUsed: 1, balanceAfter },
    })
  }

  // Drop-in payment
  if (isDropIn && dropInAmount) {
    await prisma.dropInPayment.create({
      data: { attendanceId: attendance.id, amount: dropInAmount, method: dropInMethod ?? 'CASH' },
    })
  }

  return NextResponse.json({ ok: true })
}
