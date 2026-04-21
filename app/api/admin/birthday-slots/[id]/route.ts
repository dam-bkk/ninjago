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
  if (body.locationId !== undefined) data.locationId = body.locationId ? parseInt(body.locationId) : null
  if (body.date       !== undefined) data.date       = new Date(body.date)
  if (body.startTime  !== undefined) data.startTime  = body.startTime
  if (body.endTime    !== undefined) data.endTime    = body.endTime
  if (body.maxParties !== undefined) data.maxParties = parseInt(body.maxParties)
  if (body.booked     !== undefined) data.booked     = body.booked

  const slot = await prisma.birthdaySlot.update({
    where: { id: parseInt(id) },
    data,
    include: { location: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ slot })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.birthdaySlot.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ deleted: true })
}
