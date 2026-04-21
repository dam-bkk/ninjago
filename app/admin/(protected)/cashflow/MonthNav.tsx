'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function MonthNav({ year, month }: { year: number; month: number }) {
  const router = useRouter()

  function go(delta: number) {
    let m = month + delta
    let y = year
    if (m < 1)  { m = 12; y-- }
    if (m > 12) { m = 1;  y++ }
    router.push(`/admin/cashflow?year=${y}&month=${m}`)
  }

  const isCurrentMonth = (() => {
    const now = new Date()
    return year === now.getFullYear() && month === now.getMonth() + 1
  })()

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => go(-1)}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
        style={{ background: '#F0F4F8' }}>
        <ChevronLeft size={16} style={{ color: '#0A1628' }} />
      </button>

      {!isCurrentMonth && (
        <button onClick={() => {
          const now = new Date()
          router.push(`/admin/cashflow?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
        }}
          className="btn btn-secondary text-xs px-3 h-8">
          Today
        </button>
      )}

      <button onClick={() => go(1)} disabled={isCurrentMonth}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
        style={{ background: isCurrentMonth ? '#F8FAFC' : '#F0F4F8', opacity: isCurrentMonth ? 0.4 : 1 }}>
        <ChevronRight size={16} style={{ color: '#0A1628' }} />
      </button>
    </div>
  )
}
