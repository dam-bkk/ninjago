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
  const prices = await prisma.packagePrice.findMany({ orderBy: [{ packageType: 'asc' }, { credits: 'asc' }] })
  return NextResponse.json({ prices })
}

export async function POST(req: NextRequest) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { packageType, label, price, credits, validityMonths, dropInPrice, description, highlighted } = await req.json()
  if (!packageType || !label || price === undefined || !credits || !validityMonths) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const created = await prisma.packagePrice.create({
    data: {
      packageType,
      label,
      price: parseInt(price),
      credits: parseInt(credits),
      validityMonths: parseInt(validityMonths),
      dropInPrice: dropInPrice ? parseInt(dropInPrice) : null,
      description: description || null,
      highlighted: !!highlighted,
      active: true,
    },
  })
  return NextResponse.json({ price: created })
}
