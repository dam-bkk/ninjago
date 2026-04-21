import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, hashPin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function auth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ninja_staff_token')?.value
  return token && await verifyToken(token)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { pin } = await req.json()
  if (!pin || !/^\d{4}$/.test(pin)) return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 })
  const pinHash = await hashPin(pin)
  await prisma.parent.update({ where: { id: parseInt(id) }, data: { pinHash } })
  return NextResponse.json({ ok: true })
}
