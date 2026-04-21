import { prisma } from '@/lib/prisma'
import PackagesClient from './PackagesClient'

export default async function PackagesPage() {
  const prices = await prisma.packagePrice.findMany({
    orderBy: [{ packageType: 'asc' }, { credits: 'asc' }],
  })
  return <PackagesClient initialPrices={prices} />
}
