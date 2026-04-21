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

export async function GET() {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const coaches = await prisma.user.findMany({
    where: { role: { in: ['COACH', 'ADMIN', 'SUPER_ADMIN'] } },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, email: true, phone: true, role: true, locationId: true, active: true, location: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ coaches })
}

export async function POST(req: NextRequest) {
  const staff = await auth()
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (staff.role === 'COACH') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, email, phone, role, locationId, password } = await req.json()
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already used' }, { status: 409 })

  const passwordHash = await bcrypt.hash(password, 10)
  const coach = await prisma.user.create({
    data: {
      name, email, phone: phone || null,
      role: role ?? 'COACH',
      locationId: locationId ? parseInt(locationId) : null,
      passwordHash,
      active: true,
    },
    select: { id: true, name: true, email: true, phone: true, role: true, locationId: true, active: true, location: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ coach }, { status: 201 })
}
