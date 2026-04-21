import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPin } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const { phone, pin, termsAccepted } = await req.json()

  const normalizedPhone = phone?.replace(/\s+/g, '').trim()
  if (!normalizedPhone || !pin) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const parent = await prisma.parent.findUnique({ where: { phone: normalizedPhone } })
  if (!parent || !parent.pinHash) {
    return NextResponse.json({ error: 'Phone not found' }, { status: 401 })
  }

  const valid = await verifyPin(pin, parent.pinHash)
  if (!valid) {
    return NextResponse.json({ error: 'Wrong PIN' }, { status: 401 })
  }

  // Generate a new booking token if not set
  let token = parent.bookingToken
  const updateData: Record<string, unknown> = {}

  if (!token) {
    token = crypto.randomBytes(32).toString('hex')
    updateData.bookingToken = token
  }

  // Save termsAcceptedAt if they accepted and haven't before
  if (termsAccepted && !parent.termsAcceptedAt) {
    updateData.termsAcceptedAt = new Date()
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.parent.update({ where: { id: parent.id }, data: updateData })
  }

  const res = NextResponse.json({ ok: true, preferredLang: parent.preferredLang })

  res.cookies.set('ninja_parent_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('ninja_parent_token')
  return res
}
