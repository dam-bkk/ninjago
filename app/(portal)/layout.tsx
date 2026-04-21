import { LangProvider } from '@/lib/lang-context'
import LangWrapper from '@/components/LangWrapper'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

async function getPreferredLang(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('ninja_parent_token')?.value
    if (!token) return undefined
    const parent = await prisma.parent.findUnique({
      where: { bookingToken: token },
      select: { preferredLang: true },
    })
    return parent?.preferredLang ?? undefined
  } catch {
    return undefined
  }
}

export default async function PortalGroupLayout({ children }: { children: React.ReactNode }) {
  const initialLang = await getPreferredLang()
  return (
    <LangProvider initialLang={initialLang}>
      <LangWrapper>{children}</LangWrapper>
    </LangProvider>
  )
}
