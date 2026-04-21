/**
 * Test data seed — fake students + parents + packages + reservations
 * Run: npx tsx prisma/seed-test.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const STUDENTS = [
  { name: 'Liam Dupont',      age: 7  },
  { name: 'Emma Tanaka',      age: 9  },
  { name: 'Noah Lefebvre',    age: 6  },
  { name: 'Mia Somboon',      age: 8  },
  { name: 'Lucas Martin',     age: 10 },
  { name: 'Olivia Chen',      age: 7  },
  { name: 'Ethan Rousseau',   age: 11 },
  { name: 'Ava Wongchai',     age: 6  },
  { name: 'Hugo Bernard',     age: 9  },
  { name: 'Chloe Nakamura',   age: 8  },
]

const PARENTS = [
  { name: 'Marc Dupont',      phone: '+66800000001' },
  { name: 'Yuki Tanaka',      phone: '+66800000002' },
  { name: 'Sophie Lefebvre',  phone: '+66800000003' },
  { name: 'Noi Somboon',      phone: '+66800000004' },
  { name: 'Pierre Martin',    phone: '+66800000005' },
  { name: 'Wei Chen',         phone: '+66800000006' },
  { name: 'Claire Rousseau',  phone: '+66800000007' },
  { name: 'Arisa Wongchai',   phone: '+66800000008' },
  { name: 'Jean Bernard',     phone: '+66800000009' },
  { name: 'Keiko Nakamura',   phone: '+66800000010' },
]

async function main() {
  console.log('🌱 Seeding test students...')

  // Get locations + sessions
  const locations = await prisma.location.findMany({ orderBy: { id: 'asc' } })
  if (!locations.length) {
    console.error('❌ No locations found — run the main seed first: npx tsx prisma/seed.ts')
    process.exit(1)
  }
  const loc1 = locations[0]
  const loc2 = locations[1] ?? loc1

  const sessions = await prisma.session.findMany({ where: { active: true } })
  const prices   = await prisma.packagePrice.findMany()

  if (!prices.length) {
    console.error('❌ No package prices found — run the main seed first')
    process.exit(1)
  }

  const classPack  = prices.find(p => p.packageType === 'CLASS_10')!
  const campPack   = prices.find(p => p.packageType === 'CAMP_REGULAR_10')!

  // Create parents + students + packages
  for (let i = 0; i < STUDENTS.length; i++) {
    const pd = PARENTS[i]
    const sd = STUDENTS[i]
    const loc = i % 2 === 0 ? loc1 : loc2

    // Parent
    const pinHash = await bcrypt.hash('0000', 10)
    const parent = await prisma.parent.upsert({
      where: { phone: pd.phone },
      update: {},
      create: {
        phone: pd.phone,
        name:  pd.name,
        pinHash,
        preferredLang: i % 3 === 0 ? 'fr' : 'en',
      },
    })

    // Student
    const student = await prisma.student.create({
      data: {
        name:     sd.name,
        age:      sd.age,
        parentId: parent.id,
        active:   true,
        locations: { create: { locationId: loc.id } },
      },
    })

    // Class pack (some partially used)
    const classUsed = Math.floor(Math.random() * 5)
    const expiresClass = new Date()
    expiresClass.setMonth(expiresClass.getMonth() + classPack.validityMonths)

    const classPkg = await prisma.package.create({
      data: {
        type:         'CLASS_10',
        creditType:   'CLASS',
        totalCredits: classPack.credits,
        usedCredits:  classUsed,
        pricePaid:    classPack.price,
        expiresAt:    expiresClass,
        holders: { create: { studentId: student.id, isPrimary: true } },
        payments: { create: { amount: classPack.price, method: 'CASH' } },
      },
    })

    // Camp pack for half the students
    if (i % 2 === 0 && campPack) {
      const campUsed = Math.floor(Math.random() * 3)
      const expiresCamp = new Date()
      expiresCamp.setMonth(expiresCamp.getMonth() + campPack.validityMonths)

      await prisma.package.create({
        data: {
          type:         'CAMP_REGULAR_10',
          creditType:   'CAMP',
          totalCredits: campPack.credits,
          usedCredits:  campUsed,
          pricePaid:    campPack.price,
          expiresAt:    expiresCamp,
          holders: { create: { studentId: student.id, isPrimary: true } },
          payments: { create: { amount: campPack.price, method: 'TRANSFER' } },
        },
      })
    }

    // Book today's sessions for each student (first session matching their location)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayDow = today.getDay()

    const todaySessions = sessions.filter(s =>
      s.locationId === loc.id &&
      s.dayOfWeek === todayDow &&
      s.creditType === 'CLASS'
    )

    if (todaySessions.length > 0) {
      const sess = todaySessions[0]
      await prisma.reservation.upsert({
        where: { id: -(student.id * 1000 + sess.id) }, // force create
        update: {},
        create: {
          studentId:  student.id,
          sessionId:  sess.id,
          locationId: loc.id,
          date:       today,
          status:     'EXPECTED',
        },
      }).catch(async () => {
        // Reservation already exists, skip
      })
    }

    console.log(`  ✅ ${sd.name} (age ${sd.age}) @ ${loc.name}`)
  }

  console.log('\n🎉 Test data seeded!')
  console.log('   10 students, 10 parents (PIN: 0000)')
  console.log('   All students have a 10-class pack (partially used)')
  console.log('   5 students also have a camp pack')
  console.log('   Reservations created for today\'s sessions where applicable')
  console.log('\n   To delete test data:')
  console.log('   DELETE FROM "Reservation" WHERE "studentId" IN (SELECT id FROM "Student" WHERE name LIKE \'% Dupont\' OR name LIKE \'% Tanaka\' ...)')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
