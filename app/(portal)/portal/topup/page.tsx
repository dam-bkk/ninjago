import { redirect } from 'next/navigation'
import { getParentFromCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TopUpClient from './TopUpClient'

export default async function TopUpPage() {
  const parent = await getParentFromCookie()
  if (!parent) redirect('/login')

  const [prices, settings] = await Promise.all([
    prisma.packagePrice.findMany({ where: { active: true }, orderBy: { price: 'asc' } }),
    prisma.settings.findUnique({ where: { id: 1 } }),
  ])

  const grouped = {
    'Class packs': prices.filter(p => p.packageType.startsWith('CLASS')),
    'Camp packs (9am–1pm)': prices.filter(p => p.packageType.includes('REGULAR')),
    'Extended camp (9am–2:30pm)': prices.filter(p => p.packageType.includes('EXTENDED')),
  }

  const settingsData = settings ? {
    promptpayNumber: settings.promptpayNumber,
    promptpayQrUrl: settings.promptpayQrUrl,
    whatsappNumber: settings.whatsappNumber,
  } : null

  return <TopUpClient grouped={grouped} settings={settingsData} />
}
