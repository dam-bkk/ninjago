import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ninja_staff_token')?.value
  if (!token || !await verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const inquiries = await prisma.birthdayInquiry.findMany({
    orderBy: { createdAt: 'desc' },
    include: { location: { select: { name: true } } },
  })
  return NextResponse.json({ inquiries })
}
