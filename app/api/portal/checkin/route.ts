import { NextRequest, NextResponse } from 'next/server'
import { getParentFromCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const parent = await getParentFromCookie()
  if (!parent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { studentId, sessionId, packageId, date } = await req.json()

  if (!studentId || !sessionId || !packageId || !date) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Verify student belongs to this parent
  const student = parent.students.find(s => s.id === studentId)
  if (!student) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Verify package belongs to this student and has credits
  const sp = await prisma.studentPackage.findUnique({
    where: { studentId_packageId: { studentId, packageId } },
    include: { package: true },
  })
  if (!sp) return NextResponse.json({ error: 'Package not found' }, { status: 404 })
  if (sp.package.usedCredits >= sp.package.totalCredits) {
    return NextResponse.json({ error: 'No credits left' }, { status: 400 })
  }

  // Verify session is valid
  const session = await prisma.session.findUnique({ where: { id: sessionId } })
  if (!session || !session.active) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Token expires at end of the target day (23:59:59 local Bangkok = UTC+7)
  const targetDate = new Date(date)
  const expiresAt = new Date(date)
  expiresAt.setDate(expiresAt.getDate() + 1) // expire next day midnight UTC (covers Bangkok end of day)

  // Reuse existing unused token for same student+session+date if one exists
  const existing = await prisma.checkInToken.findFirst({
    where: { studentId, sessionId, packageId, date: targetDate, usedAt: null },
  })
  if (existing) {
    return NextResponse.json({ token: existing.token })
  }

  // Create token and immediately reserve 1 credit
  const record = await prisma.$transaction(async tx => {
    const token = await tx.checkInToken.create({
      data: { studentId, sessionId, packageId, date: targetDate, expiresAt, creditReserved: true },
    })
    await tx.package.update({
      where: { id: packageId },
      data: { usedCredits: { increment: 1 } },
    })
    return token
  })

  return NextResponse.json({ token: record.token }, { status: 201 })
}
