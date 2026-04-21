'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Printer } from 'lucide-react'

type Student = {
  id: number
  name: string
  birthdate: string | Date | null
  age: number | null
  photoUrl: string | null
}

type SessionGroup = {
  id: number
  name: string
  startTime: string
  endTime: string
  creditType: string
  location: { id: number; name: string }
  students: Student[]
}

type Location = { id: number; name: string }

const CREDIT_COLORS: Record<string, string> = {
  CLASS: '#00C2E0',
  CAMP: '#CCFF00',
  CAMP_EXTENDED: '#FFB400',
}

function getAge(s: Student): string {
  if (s.birthdate) {
    const bd = new Date(s.birthdate)
    const now = new Date()
    const age = now.getFullYear() - bd.getFullYear()
      - (now < new Date(now.getFullYear(), bd.getMonth(), bd.getDate()) ? 1 : 0)
    return `${age}y`
  }
  return s.age != null ? `${s.age}y` : ''
}

function Avatar({ student }: { student: Student }) {
  const initials = student.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center font-black text-base shrink-0"
        style={{ background: student.photoUrl ? 'transparent' : '#0A1628', color: '#CCFF00' }}>
        {student.photoUrl
          ? <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
          : initials}
      </div>
      <div className="text-center w-full" style={{ maxWidth: '72px' }}>
        <p className="text-xs font-bold leading-tight truncate" style={{ color: '#0A1628' }}>
          {student.name.split(' ')[0]}
        </p>
        <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>{getAge(student)}</p>
      </div>
    </div>
  )
}

export default function TrombinoscopeClient({
  initialData, locations, initialDate, initialLocationId,
}: {
  initialData: SessionGroup[]
  locations: Location[]
  initialDate: string
  initialLocationId: number | null
}) {
  const router = useRouter()
  const [date, setDate] = useState(initialDate)
  const [locationId, setLocationId] = useState<string>(initialLocationId?.toString() ?? '')

  function apply() {
    const params = new URLSearchParams()
    if (date) params.set('date', date)
    if (locationId) params.set('locationId', locationId)
    router.push(`/admin/schedule/trombinoscope?${params.toString()}`)
  }

  const grouped = initialData.reduce<Record<string, SessionGroup[]>>((acc, s) => {
    const key = s.location.name
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card p-4 flex flex-wrap gap-3 items-end no-print">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Location</label>
          <select value={locationId} onChange={e => setLocationId(e.target.value)} className="input">
            <option value="">All locations</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <button onClick={apply} className="btn btn-primary">Apply</button>
        <div className="flex-1" />
        <button onClick={() => window.print()} className="btn btn-secondary flex items-center gap-2">
          <Printer size={15} /> Print
        </button>
      </div>

      {initialData.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-semibold" style={{ color: '#94A3B8' }}>No sessions scheduled for this day</p>
        </div>
      ) : (
        Object.entries(grouped).map(([locName, sessions]) => (
          <div key={locName} className="space-y-4">
            <h2 className="font-display font-semibold text-base uppercase tracking-wide"
              style={{ color: '#64748B' }}>
              {locName}
            </h2>
            {sessions.map(session => {
              const color = CREDIT_COLORS[session.creditType] ?? '#94A3B8'
              return (
                <div key={session.id} className="card overflow-hidden">
                  {/* Session header */}
                  <div className="px-5 py-3 flex items-center gap-3"
                    style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <div className="w-1 h-6 rounded-full shrink-0" style={{ background: color }} />
                    <div className="flex-1">
                      <p className="font-display font-semibold text-sm" style={{ color: '#0A1628' }}>{session.name}</p>
                      <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                        {session.startTime} – {session.endTime}
                      </p>
                    </div>
                    <span className="font-black text-2xl" style={{ color: '#0A1628' }}>
                      {session.students.length}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                      kid{session.students.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Student grid */}
                  <div className="p-5">
                    {session.students.length === 0 ? (
                      <p className="text-sm font-semibold text-center py-4" style={{ color: '#CBD5E1' }}>
                        No reservations yet
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-4">
                        {session.students.map(s => (
                          <Avatar key={s.id} student={s} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .card { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>
    </div>
  )
}
