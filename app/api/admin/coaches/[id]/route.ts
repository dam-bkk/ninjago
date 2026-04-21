import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

async function auth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ninja_staff_token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await auth()
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (staff.role === 'COACH') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.name     !== undefined) data.name     = body.name
  if (body.email    !== undefined) data.email    = body.email
  if (body.phone    !== undefined) data.phone    = body.phone || null
  if (body.role     !== undefined) data.role     = body.role
  if (body.locationId !== undefined) data.locationId = body.locationId ? parseInt(body.locationId) : null
  if (body.active   !== undefined) data.active   = body.active
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10)

  const coach = await prisma.user.update({
    where: { id: parseInt(id) },
    data,
    select: { id: true, name: true, email: true, phone: true, role: true, locationId: true, active: true, location: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ coach })
}
