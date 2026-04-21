import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import AdminNav from './AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Login page skips auth
  // (handled by not including it in this layout's scope via separate route)

  const cookieStore = await cookies()
  const token = cookieStore.get('ninja_staff_token')?.value

  if (!token) redirect('/admin/login')

  const staff = await verifyToken(token)
  if (!staff) redirect('/admin/login')

  return (
    <div className="min-h-screen" style={{ background: '#F0F4F8' }}>
      <AdminNav role={staff.role} />
      {/* pt-14 on mobile to clear the fixed top bar; lg:pl-14 reserves the 56px icon rail (200px when sidebar pinned via .sidebar-pinned class) */}
      <main className="pt-14 lg:pt-0 lg:pl-14 transition-[padding] duration-200">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
