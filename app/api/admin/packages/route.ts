import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('ninja_staff_token')?.value
  if (!token || !await verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { studentId, packagePriceId, pricePaid, method, groupLabel, notes } = await req.json()

  if (!studentId || !packagePriceId || pricePaid === undefined || !method) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const priceConfig = await prisma.packagePrice.findUnique({ where: { id: packagePriceId } })
  if (!priceConfig) return NextResponse.json({ error: 'Package not found' }, { status: 404 })

  // Determine credit type from package type
  const creditType = priceConfig.packageType.startsWith('CLASS')
    ? 'CLASS'
    : priceConfig.packageType.includes('EXTENDED')
    ? 'CAMP_EXTENDED'
    : 'CAMP'

  const expiresAt = priceConfig.validityMonths
    ? (() => { const d = new Date(); d.setMonth(d.getMonth() + priceConfig.validityMonths); return d })()
    : null

  const pkg = await prisma.package.create({
    data: {
      type: priceConfig.packageType,
      creditType,
      totalCredits: priceConfig.credits,
      pricePaid,
      expiresAt,
      groupLabel: groupLabel ?? null,
      notes: notes ?? null,
      holders: {
        create: { studentId, isPrimary: true },
      },
      payments: {
        create: { amount: pricePaid, method },
      },
    },
  })

  return NextResponse.json({ packageId: pkg.id })
}
