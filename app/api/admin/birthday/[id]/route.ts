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
  const { status, notes } = await req.json()
  const data: Record<string, unknown> = {}
  if (status) data.status = status
  if (notes !== undefined) data.notes = notes
  const inquiry = await prisma.birthdayInquiry.update({ where: { id: parseInt(id) }, data })
  return NextResponse.json({ inquiry })
}
