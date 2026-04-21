import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const {
    parentName, phone, email, commApp, lineId,
    kidName, kidGender, kidAge, favSuperhero, favColor,
    kid2Name, kid2Gender, kid2Age,
    guestCount, preferredDate, preferredTime,
    location, notes, isMember,
  } = await req.json()

  if (!parentName || !phone || !kidName || !kidAge) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Find location if specified
  let locationId: number | null = null
  if (location) {
    const loc = await prisma.location.findFirst({ where: { name: { contains: location } } })
    locationId = loc?.id ?? null
  }

  await prisma.birthdayInquiry.create({
    data: {
      parentName,
      phone,
      email: email || null,
      commApp: commApp || null,
      lineId: lineId || null,
      kidName,
      kidGender: kidGender || null,
      kidAge,
      favSuperhero: favSuperhero || null,
      favColor: favColor || null,
      kid2Name: kid2Name || null,
      kid2Gender: kid2Gender || null,
      kid2Age: kid2Age || null,
      guestCount: guestCount || null,
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      preferredTime: preferredTime || null,
      locationId,
      notes: notes || null,
      isMember: isMember ?? false,
      status: 'PENDING',
    },
  })

  return NextResponse.json({ ok: true })
}
