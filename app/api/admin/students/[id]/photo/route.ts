import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

async function auth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ninja_staff_token')?.value
  return token && await verifyToken(token)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const formData = await req.formData()
  const file = formData.get('photo') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `${id}.${ext}`
  const dir = path.join(process.cwd(), 'public', 'uploads', 'students')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)

  const photoUrl = `/uploads/students/${filename}`
  await prisma.student.update({ where: { id: parseInt(id) }, data: { photoUrl } })

  return NextResponse.json({ photoUrl })
}
