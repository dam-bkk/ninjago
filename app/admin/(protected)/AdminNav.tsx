'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, Package, CalendarDays,
  TrendingUp, Sword, Menu, X, LogOut, Settings, Cake, Star, UserCog,
} from 'lucide-react'

const NAV = [
  { href: '/admin',           label: 'Dashboard',    Icon: LayoutDashboard },
  { href: '/admin/students',  label: 'Students',     Icon: Users },
  { href: '/admin/packages',  label: 'Packages',     Icon: Package },
  { href: '/admin/schedule',  label: 'Schedule',     Icon: CalendarDays },
  { href: '/admin/events',    label: 'Events',       Icon: Star },
  { href: '/admin/cashflow',  label: 'Cashflow',     Icon: TrendingUp },
  { href: '/admin/coach',     label: 'Coach view',   Icon: Sword },
  { href: '/admin/coaches',   label: 'Staff',        Icon: UserCog },
  { href: '/admin/birthday',  label: 'Birthdays',    Icon: Cake },
  { href: '/admin/settings',  label: 'Settings',     Icon: Settings },
]

export default function AdminNav({ role }: { role: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pinned, setPinned] = useState(false)

  // Load pinned preference from localStorage (after hydration)
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-pinned')
    if (saved === 'true') setPinned(true)
  }, [])

  // Sync to body class and localStorage
  useEffect(() => {
    document.body.classList.toggle('sidebar-pinned', pinned)
    localStorage.setItem('sidebar-pinned', String(pinned))
  }, [pinned])

  async function handleLogout() {
    await fetch('/api/auth/staff', { method: 'DELETE' })
    router.push('/admin/login')
  }

  const roleInitials = role === 'SUPER_ADMIN' ? 'SA' : role === 'ADMIN' ? 'M' : 'C'

  return (
    <>
      {/* ── Mobile: minimal top bar (brand only) ───────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center px-4 h-14"
        style={{ background: '#0A1628', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: '#CCFF00' }}>
            <span style={{ fontSize: '0.85rem' }}>🥷</span>
          </div>
          <span className="font-display font-semibold text-white text-sm">Ninja Academy</span>
        </div>
      </div>

      {/* ── Mobile: FAB — bottom right ──────────────────────── */}
      <button
        onClick={() => setMobileOpen(v => !v)}
        className="lg:hidden fixed z-50 flex items-center justify-center shadow-xl transition-transform active:scale-95"
        style={{
          bottom: '24px',
          right: '20px',
          width: '52px',
          height: '52px',
          borderRadius: '9999px',
          background: mobileOpen ? '#CCFF00' : '#0A1628',
          color: mobileOpen ? '#0A1628' : '#CCFF00',
          border: '2px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px rgba(10,22,40,0.35)',
        }}>
        {mobileOpen ? <X size={22} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.3} />}
      </button>

      {/* ── Mobile: nav card grid overlay ──────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 flex items-end justify-end p-5 pb-24"
          style={{ background: 'rgba(10,22,40,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        >
          {/* Grid — stop propagation so clicking inside doesn't close */}
          <div
            className="grid gap-3 w-full max-w-xs"
            style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
            onClick={e => e.stopPropagation()}
          >
            {NAV.map(({ href, label, Icon }) => {
              const active = href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 px-2 transition-all active:scale-95"
                  style={active
                    ? { background: '#CCFF00', color: '#0A1628' }
                    : { background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }
                  }
                >
                  <Icon size={22} strokeWidth={2} />
                  <span className="text-xs font-bold text-center leading-tight">{label}</span>
                </Link>
              )
            })}

            {/* Sign out card */}
            <button
              onClick={() => { setMobileOpen(false); handleLogout() }}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 px-2 transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.40)' }}
            >
              <LogOut size={20} strokeWidth={2} />
              <span className="text-xs font-bold">Sign out</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <nav
        className={`hidden lg:flex shrink-0 flex-col border-r overflow-hidden transition-all duration-200${pinned ? '' : ' group/nav'}`}
        style={{
          background: '#0A1628',
          borderColor: 'rgba(255,255,255,0.06)',
          width: pinned ? '200px' : '56px',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 30,
        }}
        onMouseEnter={e => { if (!pinned) e.currentTarget.style.width = '200px' }}
        onMouseLeave={e => { if (!pinned) e.currentTarget.style.width = '56px' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b shrink-0 overflow-hidden"
          style={{ borderColor: 'rgba(255,255,255,0.06)', padding: '18px 14px' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: '#CCFF00' }}>
            <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>🥷</span>
          </div>
          <div className={`overflow-hidden whitespace-nowrap transition-opacity duration-150 delay-75${pinned ? ' opacity-100' : ' opacity-0 group-hover/nav:opacity-100'}`}>
            <p className="font-display font-semibold text-white text-sm leading-tight">Ninja Academy</p>
            <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>Admin</p>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex-1 py-3 space-y-0.5 overflow-hidden" style={{ padding: '12px 10px' }}>
          {/* Pin toggle — above Dashboard */}
          <button
            onClick={() => setPinned(v => !v)}
            className="flex items-center gap-3 rounded-xl w-full whitespace-nowrap mb-1"
            style={{ padding: '8px 10px' }}
            title={pinned ? 'Collapse sidebar' : 'Keep sidebar open'}
          >
            <div className="shrink-0" style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: '28px',
                height: '16px',
                borderRadius: '9999px',
                background: pinned ? '#CCFF00' : 'rgba(255,255,255,0.15)',
                position: 'relative',
                transition: 'background 150ms',
                flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: pinned ? '14px' : '2px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '9999px',
                  background: pinned ? '#0A1628' : 'rgba(255,255,255,0.55)',
                  transition: 'left 150ms',
                }} />
              </div>
            </div>
            <span className={`text-xs font-semibold transition-opacity duration-150 delay-75${pinned ? ' opacity-100' : ' opacity-0 group-hover/nav:opacity-100'}`}
              style={{ color: pinned ? '#CCFF00' : 'rgba(255,255,255,0.40)' }}>
              Keep open
            </span>
          </button>

          {NAV.map(({ href, label, Icon }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 rounded-xl font-semibold text-sm overflow-hidden whitespace-nowrap transition-colors"
                style={{
                  padding: '10px',
                  ...(active
                    ? { background: '#CCFF00', color: '#0A1628' }
                    : { color: 'rgba(255,255,255,0.55)' }),
                }}>
                <Icon size={18} strokeWidth={2.2} className="shrink-0" />
                <span className={`transition-opacity duration-150 delay-75${pinned ? ' opacity-100' : ' opacity-0 group-hover/nav:opacity-100'}`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Footer */}
        <div className="border-t overflow-hidden shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.06)', padding: '12px 10px' }}>

          {/* Sign out */}
          <button onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl w-full whitespace-nowrap"
            style={{ padding: '10px', color: 'rgba(255,255,255,0.30)' }}>
            <div className="w-[18px] h-[18px] rounded flex items-center justify-center shrink-0 font-black"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.40)', fontSize: '0.6rem' }}>
              {roleInitials}
            </div>
            <span className={`flex items-center gap-1.5 text-xs font-semibold transition-opacity duration-150 delay-75${pinned ? ' opacity-100' : ' opacity-0 group-hover/nav:opacity-100'}`}>
              <LogOut size={12} /> Sign out
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
