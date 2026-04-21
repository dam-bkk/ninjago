import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, hashPin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('ninja_staff_token')?.value
  if (!token || !await verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    parentPhone, parentName, parentEmail, pin,
    existingParentId,
    studentName, studentBirthdate, locationId,
  } = await req.json()

  if (!parentPhone || !studentName || !studentBirthdate || !locationId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const birthdate = new Date(studentBirthdate)
  const now = new Date()
  const age = now.getFullYear() - birthdate.getFullYear()
    - (now < new Date(now.getFullYear(), birthdate.getMonth(), birthdate.getDate()) ? 1 : 0)

  // Find or create parent
  let parentId: number

  if (existingParentId) {
    parentId = existingParentId
  } else {
    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 })
    }

    const existing = await prisma.parent.findUnique({ where: { phone: parentPhone } })
    if (existing) {
      return NextResponse.json({ error: 'Phone already registered — use Lookup to add student to existing parent' }, { status: 409 })
    }

    const pinHash = await hashPin(pin)
    const bookingToken = crypto.randomBytes(32).toString('hex')

    const parent = await prisma.parent.create({
      data: {
        phone: parentPhone,
        name: parentName ?? null,
        email: parentEmail ?? null,
        pinHash,
        bookingToken,
      },
    })
    parentId = parent.id
  }

  // Create student
  const student = await prisma.student.create({
    data: {
      name: studentName,
      birthdate,
      age,
      parentId,
      locations: {
        create: { locationId },
      },
    },
  })

  return NextResponse.json({ studentId: student.id })
}
