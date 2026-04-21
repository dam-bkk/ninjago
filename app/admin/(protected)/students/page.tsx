import { prisma } from '@/lib/prisma'
import Link from 'next/link'

function computeAge(birthdate: Date | null, age: number | null): number | null {
  if (birthdate) {
    const now = new Date()
    return now.getFullYear() - birthdate.getFullYear()
      - (now < new Date(now.getFullYear(), birthdate.getMonth(), birthdate.getDate()) ? 1 : 0)
  }
  return age
}

export default async function StudentsPage() {
  const now = new Date()
  const students = await prisma.student.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      age: true,
      birthdate: true,
      parent: { select: { phone: true, name: true } },
      locations: { select: { location: { select: { name: true } } } },
      packages: {
        where: { package: { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } },
        select: { package: { select: { creditType: true, totalCredits: true, usedCredits: true } } },
      },
    },
  })

  function balance(student: typeof students[0], creditType: string) {
    return student.packages
      .filter(sp => sp.package.creditType === creditType)
      .reduce((acc, sp) => acc + sp.package.totalCredits - sp.package.usedCredits, 0)
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>Students</h1>
          <p className="text-sm font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
            {students.length} active
          </p>
        </div>
        <Link href="/admin/students/new" className="btn btn-primary">+ Add student</Link>
      </div>

      <div className="card divide-y" style={{ borderColor: '#E2E8F0' }}>
        {students.length === 0 && (
          <div className="p-10 text-center">
            <p className="font-semibold" style={{ color: '#94A3B8' }}>No students yet</p>
            <Link href="/admin/students/new" className="btn btn-primary mt-4 inline-flex">+ Add first student</Link>
          </div>
        )}
        {students.map(s => {
          const loc = s.locations.map(l => l.location.name).join(', ') || '—'
          const cls = balance(s, 'CLASS')
          const camp = balance(s, 'CAMP')
          const ext = balance(s, 'CAMP_EXTENDED')
          const age = computeAge(s.birthdate, s.age)
          return (
            <Link key={s.id} href={`/admin/students/${s.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                style={{ background: '#0A1628', color: '#CCFF00' }}>
                {s.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: '#0A1628' }}>{s.name}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                  {age != null ? `${age} y.o.` : '—'} · {loc}
                  {s.parent ? ` · ${s.parent.name ?? s.parent.phone}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <CreditBadge count={cls} label="class" color="#00C2E0" />
                <CreditBadge count={camp} label="camp" color="#CCFF00" />
                <CreditBadge count={ext} label="ext" color="#FFB400" />
              </div>
              <span style={{ color: '#CBD5E1' }}>›</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function CreditBadge({ count, label, color }: { count: number; label: string; color: string }) {
  const empty = count === 0
  return (
    <div className="text-center rounded-lg px-2.5 py-1.5 min-w-[44px]"
      style={{
        background: empty ? '#F1F5F9' : `${color}22`,
        border: `1px solid ${empty ? '#E2E8F0' : color + '55'}`,
      }}>
      <p className="font-black text-sm leading-none" style={{ color: empty ? '#CBD5E1' : color }}>
        {count}
      </p>
      <p className="text-xs font-bold mt-0.5" style={{ color: empty ? '#CBD5E1' : '#64748B' }}>{label}</p>
    </div>
  )
}
