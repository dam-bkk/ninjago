import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ChevronLeft, Printer } from 'lucide-react'
import TrombinoscopeClient from './TrombinoscopeClient'

export default async function TrombinoscopePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; locationId?: string }>
}) {
  const params = await searchParams
  const todayStr = new Date().toISOString().split('T')[0]
  const dateStr = params.date ?? todayStr
  const date = new Date(dateStr)
  const dayOfWeek = date.getDay()

  const locationIdParam = params.locationId ? parseInt(params.locationId) : undefined

  const [locations, sessions] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: 'asc' } }),
    prisma.session.findMany({
      where: {
        dayOfWeek,
        active: true,
        ...(locationIdParam ? { locationId: locationIdParam } : {}),
      },
      include: {
        location: true,
        reservations: {
          where: { date },
          include: {
            student: {
              select: { id: true, name: true, birthdate: true, age: true, photoUrl: true },
            },
          },
        },
      },
      orderBy: [{ locationId: 'asc' }, { startTime: 'asc' }],
    }),
  ])

  // Build trombinoscope: group by session, include student list
  const data = sessions.map(s => ({
    id: s.id,
    name: s.name,
    startTime: s.startTime,
    endTime: s.endTime,
    creditType: s.creditType,
    location: s.location,
    students: s.reservations.map(r => r.student),
  }))

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4 flex-wrap no-print">
        <div className="flex items-center gap-3">
          <Link href="/admin/schedule" className="text-slate-400 hover:text-slate-600">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>Trombinoscope</h1>
            <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>
              {date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <button
          onClick={undefined}
          className="btn btn-secondary flex items-center gap-2 no-print"
          style={{ display: 'none' }}
        />
      </div>

      <TrombinoscopeClient
        initialData={data}
        locations={locations}
        initialDate={dateStr}
        initialLocationId={locationIdParam ?? null}
      />
    </div>
  )
}
