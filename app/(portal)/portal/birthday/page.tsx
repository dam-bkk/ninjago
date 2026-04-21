import { getParentFromCookie } from '@/lib/auth'
import BirthdayClient from './BirthdayClient'

export default async function BirthdayPage() {
  const parent = await getParentFromCookie()

  return (
    <BirthdayClient
      parentName={parent?.name ?? ''}
      phone={parent?.phone ?? ''}
    />
  )
}
