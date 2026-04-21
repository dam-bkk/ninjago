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

export async function GET(req: NextRequest) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  const overrides = await prisma.calendarOverride.findMany({
    where: from && to ? { date: { gte: new Date(from), lt: new Date(to) } } : {},
    orderBy: { date: 'asc' },
  })

  return NextResponse.json({ overrides })
}

export async function POST(req: NextRequest) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date, periodType, note } = await req.json()
  if (!date || !periodType) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Upsert — only one override per date
  const override = await prisma.calendarOverride.upsert({
    where: { date: new Date(date) },
    create: { date: new Date(date), periodType, note: note || null },
    update: { periodType, note: note || null },
  })

  return NextResponse.json({ override }, { status: 201 })
}
