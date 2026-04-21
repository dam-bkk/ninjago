import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function auth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ninja_staff_token')?.value
  return token && await verifyToken(token)
}

export async function GET() {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  })
  return NextResponse.json({ settings })
}

export async function PATCH(req: NextRequest) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const data: Record<string, string> = {}
  if (body.promptpayNumber !== undefined) data.promptpayNumber = body.promptpayNumber
  if (body.whatsappNumber  !== undefined) data.whatsappNumber  = body.whatsappNumber
  if (body.promptpayQrUrl  !== undefined) data.promptpayQrUrl  = body.promptpayQrUrl
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  })
  return NextResponse.json({ settings })
}
