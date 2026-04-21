'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

type Student = {
  id: number
  name: string
  age: number | null
  birthdate: string | null
  parent: { phone: string; name: string | null } | null
  locations: { location: { name: string } }[]
  packages: { package: { creditType: string; totalCredits: number; usedCredits: number } }[]
}

function computeAge(birthdate: string | null, age: number | null): number | null {
  if (birthdate) {
    const bd = new Date(birthdate)
    const now = new Date()
    return now.getFullYear() - bd.getFullYear()
      - (now < new Date(now.getFullYear(), bd.getMonth(), bd.getDate()) ? 1 : 0)
  }
  return age
}

function balance(student: Student, creditType: string) {
  return student.packages
    .filter(sp => sp.package.creditType === creditType)
    .reduce((acc, sp) => acc + sp.package.totalCredits - sp.package.usedCredits, 0)
}

export default function StudentsClient({ students }: { students: Student[] }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? students.filter(s => {
        const q = query.toLowerCase()
        return (
          s.name.toLowerCase().includes(q) ||
          s.parent?.name?.toLowerCase().includes(q) ||
          s.parent?.phone?.includes(q) ||
          s.locations.some(l => l.location.name.toLowerCase().includes(q))
        )
      })
    : students

  return (
    <>
      {/* Search */}
      <div className="relative">
        <Search size={16} strokeWidth={2.5} style={{ color: '#94A3B8', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, parent, or location…"
          className="input w-full"
          style={{ paddingLeft: '36px' }}
          autoComplete="off"
        />
      </div>

      <div className="card divide-y" style={{ borderColor: '#E2E8F0' }}>
        {students.length === 0 && (
          <div className="p-10 text-center">
            <p className="font-semibold" style={{ color: '#94A3B8' }}>No students yet</p>
            <Link href="/admin/students/new" className="btn btn-primary mt-4 inline-flex">+ Add first student</Link>
          </div>
        )}
        {filtered.length === 0 && students.length > 0 && (
          <div className="p-8 text-center">
            <p className="font-semibold" style={{ color: '#94A3B8' }}>No students match &ldquo;{query}&rdquo;</p>
          </div>
        )}
        {filtered.map(s => {
          const loc = s.locations.map(l => l.location.name).join(', ') || '—'
          const cls  = balance(s, 'CLASS')
          const camp = balance(s, 'CAMP')
          const ext  = balance(s, 'CAMP_EXTENDED')
          const age  = computeAge(s.birthdate, s.age)
          return (
            <Link key={s.id} href={`/admin/students/${s.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                style={{ background: '#0A1628', color: '#CCFF00' }}>
                {s.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: '#0A1628' }}>{s.name}</p>
                <p className="text-xs font-semibold mt-0.5 truncate" style={{ color: '#94A3B8' }}>
                  {age != null ? `${age} y.o.` : '—'} · {loc}
                  {s.parent ? ` · ${s.parent.name ?? s.parent.phone}` : ''}
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
    </>
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
      <p className="font-black text-sm leading-none" style={{ color: empty ? '#CBD5E1' : color }}>{count}</p>
      <p className="text-xs font-bold mt-0.5" style={{ color: empty ? '#CBD5E1' : '#64748B' }}>{label}</p>
    </div>
  )
}
