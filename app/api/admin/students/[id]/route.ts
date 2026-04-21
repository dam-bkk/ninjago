import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function auth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ninja_staff_token')?.value
  return token && await verifyToken(token)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.name      !== undefined) data.name      = body.name
  if (body.birthdate !== undefined) {
    data.birthdate = new Date(body.birthdate)
    const bd = data.birthdate as Date
    const now = new Date()
    data.age = now.getFullYear() - bd.getFullYear()
      - (now < new Date(now.getFullYear(), bd.getMonth(), bd.getDate()) ? 1 : 0)
  }
  if (body.photoUrl  !== undefined) data.photoUrl  = body.photoUrl
  if (body.active    !== undefined) data.active     = body.active

  const student = await prisma.student.update({ where: { id: parseInt(id) }, data })
  return NextResponse.json({ student })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await auth()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const studentId = parseInt(id)

  // Delete in dependency order
  await prisma.ledgerEntry.deleteMany({ where: { studentId } })
  await prisma.dropInPayment.deleteMany({ where: { attendance: { studentId } } })
  await prisma.attendance.deleteMany({ where: { studentId } })
  await prisma.reservation.deleteMany({ where: { studentId } })
  await prisma.checkInToken.deleteMany({ where: { studentId } })
  await prisma.studentPackage.deleteMany({ where: { studentId } })
  await prisma.studentLocation.deleteMany({ where: { studentId } })
  await prisma.student.delete({ where: { id: studentId } })

  return NextResponse.json({ ok: true })
}
