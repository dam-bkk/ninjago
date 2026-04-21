import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('ninja_staff_token')?.value
  const staff = token ? await verifyToken(token) : null
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { studentId, sessionId, locationId, date, isDropIn, dropInAmount, dropInMethod, lunch } = await req.json()

  const dateObj = new Date(date)

  // Check not already checked in
  const existing = await prisma.attendance.findFirst({
    where: { studentId, date: dateObj, locationId },
  })
  if (existing) return NextResponse.json({ error: 'Already checked in' }, { status: 409 })

  // Find or create reservation
  let reservationId: number | null = null
  if (sessionId) {
    const res = await prisma.reservation.upsert({
      where: {
        // Unique on studentId+sessionId+date — use findFirst then create
        id: -1, // force create path
      },
      update: {},
      create: {
        studentId,
        sessionId,
        locationId,
        date: dateObj,
        status: 'CHECKED_IN',
      },
    }).catch(async () => {
      // fallback: find existing reservation
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
    // Find session to get credit type
    const session = await prisma.session.findUnique({ where: { id: sessionId } })
    if (session) {
      // Find the best package (most credits, non-expired, matching credit type)
      const studentPkgs = await prisma.studentPackage.findMany({
        where: { studentId },
        include: {
          package: true,
        },
      })

      const eligible = studentPkgs
        .filter(sp =>
          sp.package.creditType === session.creditType &&
          sp.package.usedCredits < sp.package.totalCredits &&
          (!sp.package.expiresAt || sp.package.expiresAt > new Date())
        )
        .sort((a, b) =>
          // Use package expiring soonest first
          (a.package.expiresAt?.getTime() ?? Infinity) - (b.package.expiresAt?.getTime() ?? Infinity)
        )

      if (eligible.length > 0) {
        const pkg = eligible[0].package
        packageId = pkg.id
        balanceAfter = pkg.totalCredits - pkg.usedCredits - 1

        await prisma.package.update({
          where: { id: pkg.id },
          data: { usedCredits: { increment: 1 } },
        })
      }
    }
  }

  // Create attendance
  const attendance = await prisma.attendance.create({
    data: {
      studentId,
      locationId,
      coachId: staff.id,
      date: dateObj,
      reservationId,
      lunch: lunch ?? false,
      isDropIn: isDropIn ?? false,
    },
  })

  // Ledger entry
  if (packageId !== null && !isDropIn) {
    await prisma.ledgerEntry.create({
      data: {
        studentId,
        packageId,
        attendanceId: attendance.id,
        creditsUsed: 1,
        balanceAfter,
      },
    })
  }

  // Drop-in payment
  if (isDropIn && dropInAmount) {
    await prisma.dropInPayment.create({
      data: {
        attendanceId: attendance.id,
        amount: dropInAmount,
        method: dropInMethod ?? 'CASH',
      },
    })
  }

  return NextResponse.json({ ok: true, attendanceId: attendance.id })
}
