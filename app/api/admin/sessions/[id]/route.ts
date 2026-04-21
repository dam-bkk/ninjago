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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.name        !== undefined) data.name        = body.name
  if (body.sessionType !== undefined) data.sessionType = body.sessionType
  if (body.creditType  !== undefined) data.creditType  = body.creditType
  if (body.dayOfWeek   !== undefined) data.dayOfWeek   = body.dayOfWeek != null ? parseInt(body.dayOfWeek) : null
  if (body.startTime   !== undefined) data.startTime   = body.startTime
  if (body.endTime     !== undefined) data.endTime     = body.endTime
  if (body.locationId  !== undefined) data.locationId  = parseInt(body.locationId)
  if (body.includeLunch!== undefined) data.includeLunch= body.includeLunch
  if (body.periodType  !== undefined) data.periodType  = body.periodType
  if (body.maxCapacity !== undefined) data.maxCapacity = body.maxCapacity ? parseInt(body.maxCapacity) : null
  if (body.active      !== undefined) data.active      = body.active

  const session = await prisma.session.update({
    where: { id: parseInt(id) },
    data,
    include: { location: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ session })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Check if session has reservations before deleting
  const count = await prisma.reservation.count({ where: { sessionId: parseInt(id) } })
  if (count > 0) {
    // Soft-delete: deactivate instead
    await prisma.session.update({ where: { id: parseInt(id) }, data: { active: false } })
    return NextResponse.json({ deactivated: true })
  }

  await prisma.session.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ deleted: true })
}
