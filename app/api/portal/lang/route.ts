import { NextRequest, NextResponse } from 'next/server'
import { getParentFromCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  const parent = await getParentFromCookie()
  if (!parent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lang } = await req.json()
  if (!['en', 'th', 'fr'].includes(lang)) {
    return NextResponse.json({ error: 'Invalid lang' }, { status: 400 })
  }

  await prisma.parent.update({
    where: { id: parent.id },
    data: { preferredLang: lang },
  })

  return NextResponse.json({ ok: true })
}
