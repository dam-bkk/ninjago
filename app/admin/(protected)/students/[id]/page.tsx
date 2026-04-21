import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AddPackageModal from './AddPackageModal'
import StudentProfileActions from './StudentProfileActions'

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const studentId = parseInt(id)

  const [student, prices] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      include: {
        parent: true,
        locations: { include: { location: true } },
        packages: {
          include: { package: { include: { payments: true } } },
          orderBy: { addedAt: 'desc' },
        },
        attendance: {
          orderBy: { checkedInAt: 'desc' },
          take: 10,
          include: { location: true },
        },
      },
    }),
    prisma.packagePrice.findMany({ where: { active: true }, orderBy: { price: 'asc' } }),
  ])

  if (!student) notFound()

  const now = new Date()

  function balance(creditType: string) {
    return student!.packages
      .filter(sp => sp.package.creditType === creditType)
      .filter(sp => !sp.package.expiresAt || sp.package.expiresAt > now)
      .reduce((acc, sp) => acc + sp.package.totalCredits - sp.package.usedCredits, 0)
  }

  const classCredits    = balance('CLASS')
  const campCredits     = balance('CAMP')
  const extCredits      = balance('CAMP_EXTENDED')

  return (
    <div className="p-8 space-y-6 max-w-3xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#94A3B8' }}>
        <Link href="/admin/students" className="hover:text-slate-600">Students</Link>
        <span>›</span>
        <span style={{ color: '#0A1628' }}>{student.name}</span>
      </div>

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <StudentProfileActions
              studentId={student.id}
              studentName={student.name}
              birthdate={student.birthdate?.toISOString() ?? null}
              photoUrl={student.photoUrl ?? null}
              parentId={student.parent?.id ?? null}
              parentName={student.parent?.name ?? null}
              parentPhone={student.parent?.phone ?? ''}
            />
            <div>
              <h1 className="font-display font-semibold text-xl" style={{ color: '#0A1628' }}>{student.name}</h1>
              <p className="text-sm font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                {(() => {
                  if (student.birthdate) {
                    const bd = student.birthdate
                    const age = now.getFullYear() - bd.getFullYear()
                      - (now < new Date(now.getFullYear(), bd.getMonth(), bd.getDate()) ? 1 : 0)
                    const nextBday = new Date(now.getFullYear(), bd.getMonth(), bd.getDate())
                    if (nextBday < now) nextBday.setFullYear(now.getFullYear() + 1)
                    const daysUntil = Math.ceil((nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    const bdStr = bd.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
                    return `${age} y.o. · born ${bdStr}${daysUntil <= 31 ? ` · 🎂 in ${daysUntil}d` : ''}`
                  }
                  return student.age != null ? `${student.age} y.o.` : '—'
                })()} · {student.locations.map(l => l.location.name).join(', ') || '—'}
              </p>
              {student.parent && (
                <p className="text-xs font-semibold mt-1" style={{ color: '#94A3B8' }}>
                  Parent: {student.parent.name ?? '—'} · {student.parent.phone}
                  {' · PIN: '}
                  <span className="font-black" style={{ color: '#0A1628' }}>••••</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Credits */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <CreditBox count={classCredits} label="Class credits" color="#00C2E0" />
          <CreditBox count={campCredits} label="Camp credits" color="#CCFF00" />
          <CreditBox count={extCredits} label="Extended credits" color="#FFB400" />
        </div>
      </div>

      {/* Packages */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-sm uppercase tracking-wide" style={{ color: '#64748B' }}>
            Packages
          </h2>
          <AddPackageModal studentId={student.id} prices={prices} />
        </div>

        <div className="space-y-2">
          {student.packages.length === 0 && (
            <div className="card p-5 text-center">
              <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>No packages yet</p>
            </div>
          )}
          {student.packages.map(sp => {
            const pkg = sp.package
            const remaining = pkg.totalCredits - pkg.usedCredits
            const expired = pkg.expiresAt && pkg.expiresAt < now
            const creditColor = pkg.creditType === 'CLASS' ? '#00C2E0' : pkg.creditType === 'CAMP' ? '#CCFF00' : '#FFB400'
            const creditTextColor = '#0A1628'
            return (
              <div key={pkg.id} className="card p-4 flex items-center gap-4"
                style={expired ? { opacity: 0.5 } : {}}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm" style={{ color: '#0A1628' }}>{pkg.type.replace(/_/g, ' ')}</p>
                    <span className="badge" style={{ background: creditColor, color: creditTextColor, border: `1px solid ${creditColor}` }}>
                      {pkg.creditType.replace('_', ' ')}
                    </span>
                    {expired && <span className="badge badge-red">Expired</span>}
                    {sp.isPrimary && <span className="badge badge-cyan">Primary</span>}
                  </div>
                  <p className="text-xs font-semibold mt-1" style={{ color: '#94A3B8' }}>
                    {pkg.usedCredits}/{pkg.totalCredits} used
                    {pkg.expiresAt ? ` · expires ${new Date(pkg.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ' · no expiry'}
                    {pkg.groupLabel ? ` · shared: ${pkg.groupLabel}` : ''}
                  </p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                    Paid: ฿{pkg.pricePaid.toLocaleString()}
                    {pkg.payments[0] ? ` · ${pkg.payments[0].method.replace('_', ' ')}` : ''}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0"
                  style={{ background: creditColor }}>
                  <p className="font-black text-xl leading-none" style={{ color: creditTextColor }}>{remaining}</p>
                  <p className="text-xs font-bold mt-0.5" style={{ color: 'rgba(10,22,40,0.55)' }}>left</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent attendance */}
      <div>
        <h2 className="font-display font-semibold text-sm uppercase tracking-wide mb-3" style={{ color: '#64748B' }}>
          Recent attendance
        </h2>
        <div className="card divide-y" style={{ borderColor: '#E2E8F0' }}>
          {student.attendance.length === 0 && (
            <div className="p-5 text-center">
              <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>No attendance yet</p>
            </div>
          )}
          {student.attendance.map(a => (
            <div key={a.id} className="flex items-center gap-4 px-5 py-3">
              <div className="text-center shrink-0">
                <p className="text-xs font-black" style={{ color: '#0A1628' }}>
                  {new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: '#0A1628' }}>{a.location.name}</p>
                <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                  {new Date(a.checkedInAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {a.isDropIn && <span className="badge badge-yellow">Drop-in</span>}
              {a.lunch && <span className="badge badge-cyan">Lunch</span>}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

function CreditBox({ count, label, color }: { count: number; label: string; color: string }) {
  const empty = count === 0
  return (
    <div className="rounded-xl p-4 text-center"
      style={{
        background: empty ? '#F8FAFC' : color,
        border: `1.5px solid ${empty ? '#E2E8F0' : 'transparent'}`,
      }}>
      <p className="font-display font-semibold text-3xl" style={{ color: empty ? '#CBD5E1' : '#0A1628' }}>{count}</p>
      <p className="text-xs font-bold mt-1" style={{ color: empty ? '#94A3B8' : 'rgba(10,22,40,0.60)' }}>{label}</p>
    </div>
  )
}
