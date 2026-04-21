import { prisma } from '@/lib/prisma'
import BirthdaySlotsClient from './BirthdaySlotsClient'

export default async function BirthdaySlotsPage() {
  const [slots, locations] = await Promise.all([
    prisma.birthdaySlot.findMany({
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: { location: { select: { id: true, name: true } } },
    }),
    prisma.location.findMany({ orderBy: { id: 'asc' } }),
  ])

  return <BirthdaySlotsClient initialSlots={slots} locations={locations} />
}
