import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function findToken(token: string) {
  return prisma.checkInToken.findUnique({
    where: { token },
    include: {
      student: { select: { id: true, name: true, age: true, photoUrl: true } },
      session: { select: { id: true, name: true, startTime: true, endTime: true, locationId: true, location: { select: { name: true } }, creditType: true } },
      package: { select: { id: true, creditType: true, totalCredits: true, usedCredits: true, expiresAt: true, groupLabel: true } },
    },
  })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const record = await findToken(token)

  if (!record) return NextResponse.json({ error: 'Token invalide' }, { status: 404 })
  if (record.usedAt) return NextResponse.json({ error: 'Déjà utilisé', usedAt: record.usedAt }, { status: 409 })
  if (new Date() > record.expiresAt) return NextResponse.json({ error: 'Token expiré' }, { status: 410 })

  return NextResponse.json({
    student: record.student,
    session: record.session,
    package: record.package,
    date: record.date,
    creditsLeft: record.package.totalCredits - record.package.usedCredits,
  })
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const record = await findToken(token)

  if (!record) return NextResponse.json({ error: 'Token invalide' }, { status: 404 })
  if (record.usedAt) return NextResponse.json({ error: 'Déjà utilisé', usedAt: record.usedAt }, { status: 409 })
  if (new Date() > record.expiresAt) return NextResponse.json({ error: 'Token expiré' }, { status: 410 })

  const creditsLeft = record.package.totalCredits - record.package.usedCredits
  if (creditsLeft <= 0) return NextResponse.json({ error: 'Plus de crédits' }, { status: 400 })

  // Run in transaction: reservation + attendance + ledger + increment usedCredits + mark token used
  const result = await prisma.$transaction(async tx => {
    // Upsert reservation
    let reservation = await tx.reservation.findFirst({
      where: { studentId: record.studentId, sessionId: record.sessionId, date: record.date },
    })
    if (!reservation) {
      reservation = await tx.reservation.create({
        data: {
          studentId: record.studentId,
          sessionId: record.sessionId,
          locationId: record.session.locationId,
          date: record.date,
          status: 'CHECKED_IN',
        },
      })
    } else {
      await tx.reservation.update({ where: { id: reservation.id }, data: { status: 'CHECKED_IN' } })
    }

    // Create attendance
    const attendance = await tx.attendance.create({
      data: {
        studentId: record.studentId,
        reservationId: reservation.id,
        locationId: record.session.locationId,
        date: record.date,
        checkedInAt: new Date(),
        lunch: false,
        isDropIn: false,
      },
    })

    // Increment package usedCredits
    const updatedPackage = await tx.package.update({
      where: { id: record.packageId },
      data: { usedCredits: { increment: 1 } },
    })

    // Ledger entry
    await tx.ledgerEntry.create({
      data: {
        studentId: record.studentId,
        packageId: record.packageId,
        attendanceId: attendance.id,
        creditsUsed: 1,
        balanceAfter: updatedPackage.totalCredits - updatedPackage.usedCredits,
      },
    })

    // Mark token as used
    await tx.checkInToken.update({
      where: { token },
      data: { usedAt: new Date() },
    })

    return { student: record.student, session: record.session, creditsAfter: updatedPackage.totalCredits - updatedPackage.usedCredits }
  })

  return NextResponse.json({ success: true, ...result })
}
