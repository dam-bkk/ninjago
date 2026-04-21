import { prisma } from '@/lib/prisma'
import MonthNav from './MonthNav'

type SearchParams = { month?: string; year?: string }

function methodLabel(m: string) {
  return m === 'CASH' ? 'Cash' : m === 'TRANSFER' ? 'Transfer' : 'QR PromptPay'
}
function methodColor(m: string) {
  return m === 'CASH' ? '#22C55E' : m === 'TRANSFER' ? '#00C2E0' : '#6366F1'
}

export default async function CashflowPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const now = new Date()
  const year  = sp.year  ? parseInt(sp.year)  : now.getFullYear()
  const month = sp.month ? parseInt(sp.month) : now.getMonth() + 1 // 1-based

  const from = new Date(year, month - 1, 1)
  const to   = new Date(year, month, 1) // exclusive

  const [payments, dropIns] = await Promise.all([
    prisma.payment.findMany({
      where: { paidAt: { gte: from, lt: to } },
      orderBy: { paidAt: 'desc' },
      include: {
        package: {
          select: {
            type: true,
            holders: {
              take: 1,
              include: { student: { select: { name: true } } },
            },
          },
        },
      },
    }),
    prisma.dropInPayment.findMany({
      where: { paidAt: { gte: from, lt: to } },
      orderBy: { paidAt: 'desc' },
      include: {
        attendance: {
          include: {
            student: { select: { name: true } },
            location: { select: { name: true } },
          },
        },
      },
    }),
  ])

  // Merge into unified list
  type Tx = {
    id: string
    date: Date
    studentName: string
    label: string
    amount: number
    method: string
    isDropIn: boolean
  }

  const txs: Tx[] = [
    ...payments.map(p => ({
      id: `pay-${p.id}`,
      date: p.paidAt,
      studentName: p.package.holders[0]?.student.name ?? '—',
      label: formatPackageType(p.package.type),
      amount: p.amount,
      method: p.method,
      isDropIn: false,
    })),
    ...dropIns.map(d => ({
      id: `drop-${d.id}`,
      date: d.paidAt,
      studentName: d.attendance.student.name,
      label: `Drop-in · ${d.attendance.location.name}`,
      amount: d.amount,
      method: d.method,
      isDropIn: true,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  const total = txs.reduce((s, t) => s + t.amount, 0)

  // Breakdown by method
  const byMethod: Record<string, number> = {}
  for (const t of txs) {
    byMethod[t.method] = (byMethod[t.method] ?? 0) + t.amount
  }

  const monthLabel = from.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="p-8 space-y-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>Cashflow</h1>
          <p className="text-sm font-semibold mt-0.5" style={{ color: '#64748B' }}>{monthLabel}</p>
        </div>
        <MonthNav year={year} month={month} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5 col-span-2 lg:col-span-1" style={{ borderLeft: '4px solid #0A1628' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Total</p>
          <p className="font-display font-semibold mt-2" style={{ color: '#0A1628', fontSize: '1.8rem', lineHeight: 1 }}>
            ฿{total.toLocaleString()}
          </p>
          <p className="text-xs font-semibold mt-1" style={{ color: '#CBD5E1' }}>{txs.length} transactions</p>
        </div>
        {['CASH', 'TRANSFER', 'QR_PROMPTPAY'].map(m => (
          <div key={m} className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>{methodLabel(m)}</p>
            <p className="font-display font-semibold mt-2" style={{ color: methodColor(m), fontSize: '1.4rem', lineHeight: 1 }}>
              ฿{(byMethod[m] ?? 0).toLocaleString()}
            </p>
            <p className="text-xs font-semibold mt-1" style={{ color: '#CBD5E1' }}>
              {txs.filter(t => t.method === m).length} tx
            </p>
          </div>
        ))}
      </div>

      {/* Transaction list */}
      <div>
        <h2 className="font-display font-semibold text-sm mb-3" style={{ color: '#64748B' }}>Transactions</h2>

        {txs.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>No transactions this month</p>
          </div>
        ) : (
          <div className="card divide-y" style={{ borderColor: '#E2E8F0' }}>
            {txs.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3">
                {/* Date */}
                <div className="shrink-0 w-10 text-center">
                  <p className="font-black text-base leading-none" style={{ color: '#0A1628' }}>
                    {t.date.getDate()}
                  </p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                    {t.date.toLocaleDateString('en-GB', { month: 'short' })}
                  </p>
                </div>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                  style={{ background: t.isDropIn ? '#FEF3C7' : '#F0F4F8', color: '#0A1628' }}>
                  {t.studentName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: '#0A1628' }}>{t.studentName}</p>
                  <p className="text-xs font-semibold truncate" style={{ color: '#94A3B8' }}>{t.label}</p>
                </div>

                {/* Method badge */}
                <span className="text-xs font-bold px-2 py-1 rounded-lg shrink-0"
                  style={{ background: methodColor(t.method) + '18', color: methodColor(t.method) }}>
                  {methodLabel(t.method)}
                </span>

                {/* Amount */}
                <p className="font-black text-base shrink-0" style={{ color: '#0A1628' }}>
                  ฿{t.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function formatPackageType(type: string) {
  const map: Record<string, string> = {
    CLASS_10: 'Class pack · 10 credits',
    CLASS_20: 'Class pack · 20 credits',
    CAMP_REGULAR_10: 'Camp pack · 10 credits',
    CAMP_REGULAR_20: 'Camp pack · 20 credits',
    CAMP_EXTENDED_10: 'Extended camp · 10 credits',
    CAMP_EXTENDED_20: 'Extended camp · 20 credits',
  }
  return map[type] ?? type
}
