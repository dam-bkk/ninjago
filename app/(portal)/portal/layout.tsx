import { redirect } from 'next/navigation'
import { getParentFromCookie } from '@/lib/auth'
import PortalBottomNav from './PortalBottomNav'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const parent = await getParentFromCookie()
  if (!parent) redirect('/login')

  return (
    <div className="portal min-h-screen">
      {/* main content — pb for bottom nav */}
      <div className="pb-8">
        {children}
      </div>
      <PortalBottomNav />
    </div>
  )
}
