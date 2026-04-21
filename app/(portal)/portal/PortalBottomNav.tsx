'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Home, CalendarDays, CreditCard, Cake, Menu, X, LogOut } from 'lucide-react'
import { useLang, t } from '@/lib/lang-context'

export default function PortalBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { lang } = useLang()
  const d = t(lang)

  const NAV = [
    { href: '/portal',          label: d.myChildren, Icon: Home },
    { href: '/portal/schedule', label: d.schedule,   Icon: CalendarDays },
    { href: '/portal/topup',    label: d.topUp,      Icon: CreditCard },
    { href: '/portal/birthday', label: d.birthday,   Icon: Cake },
  ]

  async function handleLogout() {
    await fetch('/api/auth/parent', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <>
      {/* FAB — bottom right */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed z-50 flex items-center justify-center shadow-xl transition-transform active:scale-95"
        style={{
          bottom: '24px',
          right: '20px',
          width: '52px',
          height: '52px',
          borderRadius: '9999px',
          background: open ? '#CCFF00' : '#0A1628',
          color: open ? '#0A1628' : '#CCFF00',
          border: '2px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px rgba(10,22,40,0.25)',
        }}>
        {open ? <X size={22} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.3} />}
      </button>

      {/* Overlay + card grid */}
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-end p-5 pb-20"
          style={{ background: 'rgba(10,22,40,0.40)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="grid gap-3 w-full max-w-xs"
            style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
            onClick={e => e.stopPropagation()}
          >
            {NAV.map(({ href, label, Icon }) => {
              const active = href === '/portal' ? pathname === '/portal' : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 px-2 transition-all active:scale-95"
                  style={active
                    ? { background: '#CCFF00', color: '#0A1628' }
                    : { background: '#1a3a5c', color: 'rgba(255,255,255,0.85)' }
                  }
                >
                  <Icon size={22} strokeWidth={2} />
                  <span className="text-xs font-bold text-center leading-tight whitespace-nowrap">{label}</span>
                </Link>
              )
            })}

            {/* Sign out */}
            <button
              onClick={() => { setOpen(false); handleLogout() }}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 px-2 transition-all active:scale-95"
              style={{ background: '#1a3a5c', color: 'rgba(255,255,255,0.40)' }}
            >
              <LogOut size={20} strokeWidth={2} />
              <span className="text-xs font-bold">{d.signOut}</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
