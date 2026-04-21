import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import Link from 'next/link'

async function getStats() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const todayDate = new Date(now.toISOString().split('T')[0])

  const [
    totalStudents,
    allNonExpiredPacks,
    revenueMonth,
    todayAttendance,
    birthdayPending,
    activeStudentsWithPacks,
  ] = await Promise.all([
    prisma.student.count({ where: { active: true } }),

    prisma.package.findMany({
      where: { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      select: { totalCredits: true, usedCredits: true },
    }),

    prisma.payment.aggregate({
      where: { paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),

    prisma.attendance.count({
      where: { date: { equals: todayDate } },
    }),

    prisma.birthdayInquiry.count({ where: { status: 'PENDING' } }),

    prisma.student.findMany({
      where: { active: true },
      select: {
        packages: {
          where: {
            package: {
              creditType: 'CLASS',
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
          },
          select: { package: { select: { totalCredits: true, usedCredits: true } } },
        },
      },
    }),
  ])

  const activePackages = allNonExpiredPacks.filter(p => p.usedCredits < p.totalCredits).length

  const lowCreditStudents = activeStudentsWithPacks.filter(s => {
    const balance = s.packages.reduce(
      (acc, sp) => acc + sp.package.totalCredits - sp.package.usedCredits, 0
    )
    return balance > 0 && balance <= 3
  }).length

  return {
    totalStudents,
    activePackages,
    revenueMonth: revenueMonth._sum.amount ?? 0,
    todayAttendance,
    birthdayPending,
    lowCreditStudents,
  }
}

async function getTodayHeadcount() {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const date = new Date(dateStr)
  const dayOfWeek = now.getDay()

  const sessions = await prisma.session.findMany({
    where: { dayOfWeek, active: true },
    orderBy: [{ locationId: 'asc' }, { startTime: 'asc' }],
    include: {
      location: { select: { id: true, name: true } },
      reservations: {
        where: { date },
        include: { attendance: { select: { id: true, lunch: true } } },
      },
    },
  })

  return sessions.map(s => ({
    id: s.id,
    name: s.name,
    startTime: s.startTime,
    endTime: s.endTime,
    location: s.location,
    total: s.reservations.length,
    checkedIn: s.reservations.filter(r => r.attendance).length,
    meals: s.reservations.filter(r => r.attendance?.lunch).length,
  }))
}

async function getStudents() {
  const now = new Date()
  return prisma.student.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    include: {
      parent: { select: { phone: true, name: true } },
      locations: { include: { location: true } },
      packages: {
        where: { package: { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } },
        include: { package: { select: { creditType: true, totalCredits: true, usedCredits: true, expiresAt: true } } },
      },
    },
  })
}

async function getUpcomingBirthdays() {
  const now = new Date()
  const students = await prisma.student.findMany({
    where: { active: true, birthdate: { not: null } },
    select: { id: true, name: true, birthdate: true, photoUrl: true },
    orderBy: { name: 'asc' },
  })
  return students
    .map(s => {
      const bd = s.birthdate!
      const thisYear = new Date(now.getFullYear(), bd.getMonth(), bd.getDate())
      const nextBday = thisYear < now ? new Date(now.getFullYear() + 1, bd.getMonth(), bd.getDate()) : thisYear
      const daysUntil = Math.ceil((nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const age = nextBday.getFullYear() - bd.getFullYear()
      return { ...s, daysUntil, nextBday, turnsAge: age }
    })
    .filter(s => s.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

async function getRecentAttendance() {
  return prisma.attendance.findMany({
    orderBy: { checkedInAt: 'desc' },
    take: 8,
    include: {
      student: true,
      location: true,
      coach: { select: { name: true } },
    },
  })
}

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ninja_staff_token')?.value!
  const staff = await verifyToken(token)

  const [stats, recentAttendance, todaySessions, students, upcomingBirthdays] = await Promise.all([
    getStats(),
    getRecentAttendance(),
    getTodayHeadcount(),
    getStudents(),
    getUpcomingBirthdays(),
  ])

  const now = new Date()
  const monthName = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="p-8 space-y-8 max-w-5xl">

      {/* Header */}
      <div>
        <h1 className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>
          Dashboard
        </h1>
        <p className="text-sm font-semibold mt-0.5" style={{ color: '#64748B' }}>
          {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Active students"
          value={stats.totalStudents}
          sub="registered"
          color="#00C2E0"
        />
        <StatCard
          label="Today's check-ins"
          value={stats.todayAttendance}
          sub="all locations"
          color="#CCFF00"
          dark
        />
        <StatCard
          label={`Revenue — ${monthName}`}
          value={`฿${stats.revenueMonth.toLocaleString()}`}
          sub="payments recorded"
          color="#0A1628"
        />
        <StatCard
          label="Active packs"
          value={stats.activePackages}
          sub="with remaining credits"
          color="#6366F1"
        />
        <StatCard
          label="Low credits"
          value={stats.lowCreditStudents}
          sub="≤ 3 class credits left"
          color="#F59E0B"
          alert={stats.lowCreditStudents > 0}
        />
        <StatCard
          label="Birthday requests"
          value={stats.birthdayPending}
          sub="pending reply"
          color="#EC4899"
          alert={stats.birthdayPending > 0}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-display font-semibold text-sm mb-3" style={{ color: '#64748B' }}>
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <a href="/admin/students/new" className="btn btn-primary">+ Add student</a>
          <a href="/admin/packages/new" className="btn btn-primary">+ Record payment</a>
          <a href="/admin/schedule" className="btn btn-secondary">View schedule</a>
          <a href="/admin/cashflow" className="btn btn-secondary">Cashflow</a>
        </div>
      </div>

      {/* Students */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-sm" style={{ color: '#64748B' }}>
            Students <span className="font-bold" style={{ color: '#0A1628' }}>{students.length}</span>
          </h2>
          <Link href="/admin/students/new" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}>
            + Add
          </Link>
        </div>
        <div className="card divide-y" style={{ borderColor: '#E2E8F0' }}>
          {students.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>No students yet</p>
            </div>
          )}
          {students.map(s => {
            const balance = (type: string) => s.packages
              .filter(sp => sp.package.creditType === type)
              .reduce((acc, sp) => acc + sp.package.totalCredits - sp.package.usedCredits, 0)
            const cls  = balance('CLASS')
            const camp = balance('CAMP')
            const ext  = balance('CAMP_EXTENDED')
            const loc  = s.locations.map(l => l.location.name).join(', ') || '—'
            const lowAlert = (cls > 0 && cls <= 2) || (camp > 0 && camp <= 2) || (ext > 0 && ext <= 2)
            return (
              <Link key={s.id} href={`/admin/students/${s.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                  style={{ background: '#0A1628', color: '#CCFF00' }}>
                  {s.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm" style={{ color: '#0A1628' }}>{s.name}</p>
                    {lowAlert && (
                      <span className="text-xs font-black px-1.5 py-0.5 rounded-md"
                        style={{ background: '#FEF3C7', color: '#D97706' }}>!</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                    Age {s.age} · {loc}{s.parent ? ` · ${s.parent.name ?? s.parent.phone}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <CreditBadge count={cls}  label="class" color="#00C2E0" />
                  <CreditBadge count={camp} label="camp"  color="#CCFF00" />
                  <CreditBadge count={ext}  label="ext"   color="#FFB400" />
                </div>
                <span style={{ color: '#CBD5E1' }}>›</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Today's headcount by location */}
      {todaySessions.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-sm mb-3" style={{ color: '#64748B' }}>
            Today's sessions
          </h2>
          <div className="space-y-4">
            {/* Group by location */}
            {Array.from(new Map(todaySessions.map(s => [s.location.id, s.location])).values()).map(loc => {
              const locSessions = todaySessions.filter(s => s.location.id === loc.id)
              const locTotal = locSessions.reduce((sum, s) => sum + s.total, 0)
              const locMeals = locSessions.reduce((sum, s) => sum + s.meals, 0)
              return (
                <div key={loc.id} className="card overflow-hidden">
                  {/* Location header */}
                  <div className="px-5 py-3 flex items-center justify-between"
                    style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <p className="font-display font-semibold text-sm" style={{ color: '#0A1628' }}>{loc.name}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold" style={{ color: '#64748B' }}>
                        {locTotal} kid{locTotal !== 1 ? 's' : ''} total
                      </span>
                      {locMeals > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                          style={{ background: '#FEF3C7', color: '#D97706' }}>
                          🍽 {locMeals} meal{locMeals !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Sessions */}
                  {locSessions.map(s => (
                    <div key={s.id} className="flex items-center gap-4 px-5 py-3 border-b last:border-0"
                      style={{ borderColor: '#F1F5F9' }}>
                      <div className="flex-1">
                        <p className="text-sm font-bold" style={{ color: '#0A1628' }}>{s.name}</p>
                        <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                          {s.startTime} – {s.endTime}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-black text-base leading-none" style={{ color: '#0A1628' }}>
                            {s.checkedIn}<span className="font-bold text-sm" style={{ color: '#94A3B8' }}>/{s.total}</span>
                          </p>
                          <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>kids</p>
                        </div>
                        {s.meals > 0 ? (
                          <div className="text-right min-w-[48px]">
                            <p className="font-black text-base leading-none" style={{ color: '#F59E0B' }}>{s.meals}</p>
                            <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>meals</p>
                          </div>
                        ) : (
                          <div className="min-w-[48px]" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upcoming birthdays */}
      {upcomingBirthdays.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-sm mb-3" style={{ color: '#64748B' }}>
            🎂 Birthdays in the next 30 days
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingBirthdays.map(s => (
              <Link key={s.id} href={`/admin/students/${s.id}`}
                className="card p-3 flex items-center gap-3 hover:shadow-md transition-all">
                <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center font-black text-xs shrink-0"
                  style={{ background: '#0A1628', color: '#CCFF00' }}>
                  {s.photoUrl
                    ? <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                    : s.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: '#0A1628' }}>{s.name}</p>
                  <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                    {s.nextBday.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} · turns {s.turnsAge}
                  </p>
                </div>
                <span className="text-xs font-black px-2 py-1 rounded-lg shrink-0"
                  style={{ background: s.daysUntil <= 7 ? '#FFF7ED' : '#F8FAFC', color: s.daysUntil <= 7 ? '#C2410C' : '#64748B' }}>
                  {s.daysUntil === 0 ? "Today 🎉" : `in ${s.daysUntil}d`}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent check-ins */}
      <div>
        <h2 className="font-display font-semibold text-sm mb-3" style={{ color: '#64748B' }}>
          Recent check-ins
        </h2>
        {recentAttendance.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>No check-ins yet today</p>
          </div>
        ) : (
          <div className="card divide-y" style={{ borderColor: '#E2E8F0' }}>
            {recentAttendance.map(a => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                  style={{ background: '#F0F4F8', color: '#0A1628' }}>
                  {a.student.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: '#0A1628' }}>{a.student.name}</p>
                  <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                    {a.location.name} · {a.checkedInAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    {a.coach ? ` · ${a.coach.name}` : ''}
                  </p>
                </div>
                {a.isDropIn && (
                  <span className="badge badge-yellow">Drop-in</span>
                )}
                {a.lunch && (
                  <span className="badge badge-cyan">Lunch</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function CreditBadge({ count, label, color }: { count: number; label: string; color: string }) {
  const empty = count === 0
  const low = count > 0 && count <= 2
  return (
    <div className="text-center rounded-lg px-2.5 py-1.5 min-w-[44px]"
      style={{
        background: low ? '#FEF3C7' : empty ? '#F1F5F9' : color,
        border: `1px solid ${low ? '#FCD34D' : empty ? '#E2E8F0' : 'transparent'}`,
      }}>
      <p className="font-black text-sm leading-none" style={{ color: low ? '#D97706' : empty ? '#CBD5E1' : '#0A1628' }}>
        {count}
      </p>
      <p className="text-xs font-bold mt-0.5" style={{ color: low ? '#92400E' : empty ? '#CBD5E1' : 'rgba(10,22,40,0.60)' }}>{label}</p>
    </div>
  )
}

function StatCard({
  label, value, sub, color, dark, alert,
}: {
  label: string; value: string | number; sub: string
  color: string; dark?: boolean; alert?: boolean
}) {
  return (
    <div className="card p-5 space-y-3" style={alert ? { borderLeft: '4px solid #F59E0B' } : {}}>
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>{label}</p>
      <p className="font-display font-semibold" style={{ color, fontSize: '2rem', lineHeight: 1 }}>
        {value}
      </p>
      <p className="text-xs font-semibold" style={{ color: '#CBD5E1' }}>{sub}</p>
    </div>
  )
}
