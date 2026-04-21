import { prisma } from '@/lib/prisma'
import NewStudentForm from './NewStudentForm'

export default async function NewStudentPage() {
  const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } })
  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>Add student</h1>
        <p className="text-sm font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
          Create a parent account + student profile
        </p>
      </div>
      <NewStudentForm locations={locations} />
    </div>
  )
}
