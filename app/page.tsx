import { redirect } from 'next/navigation'
import { getParentFromCookie } from '@/lib/auth'

export default async function RootPage() {
  const parent = await getParentFromCookie()
  if (parent) redirect('/portal')
  redirect('/login')
}
