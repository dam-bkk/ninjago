import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('ninja_staff_token')?.value
  if (!token || !await verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const phone = req.nextUrl.searchParams.get('phone')
  if (!phone) return NextResponse.json({ error: 'Missing phone' }, { status: 400 })

  const parent = await prisma.parent.findUnique({
    where: { phone },
    select: { id: true, name: true, phone: true, students: { select: { id: true, name: true } } },
  })

  if (!parent) return NextResponse.json({ parent: null }, { status: 404 })
  return NextResponse.json({ parent })
}
