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
  if (body.label       !== undefined) data.label        = body.label
  if (body.price       !== undefined) data.price        = parseInt(body.price)
  if (body.credits     !== undefined) data.credits      = parseInt(body.credits)
  if (body.validityMonths !== undefined) data.validityMonths = parseInt(body.validityMonths)
  if (body.dropInPrice !== undefined) data.dropInPrice  = body.dropInPrice ? parseInt(body.dropInPrice) : null
  if (body.description !== undefined) data.description  = body.description || null
  if (body.highlighted !== undefined) data.highlighted  = !!body.highlighted
  if (body.active      !== undefined) data.active       = !!body.active
  if (body.packageType !== undefined) data.packageType  = body.packageType

  const updated = await prisma.packagePrice.update({ where: { id: parseInt(id) }, data })
  return NextResponse.json({ price: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await prisma.packagePrice.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
