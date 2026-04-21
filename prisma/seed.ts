import 'dotenv/config'
import { PrismaClient, PackageType, CreditType, SessionType, PeriodType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // ─── LOCATIONS ──────────────────────────────────────────
  const sathorn = await prisma.location.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Sathorn', address: 'Ninja School Sathorn, Bangkok' },
  })

  const ekamai = await prisma.location.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Ekamai', address: 'Ninja Academy Ekamai, Bangkok' },
  })

  console.log('✅ Locations: Sathorn, Ekamai')

  // ─── SUPER ADMIN ────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'damien@ninja.academy' },
    update: {},
    create: {
      email: 'damien@ninja.academy',
      name: 'Damien',
      passwordHash: await bcrypt.hash('changeme', 12),
      role: 'SUPER_ADMIN',
    },
  })

  // ─── MANAGER (gérant) ───────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'manager@ninja.academy' },
    update: {},
    create: {
      email: 'manager@ninja.academy',
      name: 'Manager',
      passwordHash: await bcrypt.hash('changeme', 12),
      role: 'ADMIN',
    },
  })

  console.log('✅ Staff: super admin + manager')

  // ─── PRICING ────────────────────────────────────────────
  const prices = [
    // Classes (both locations — same pricing)
    {
      packageType: PackageType.CLASS_10,
      label: '10 Class Pack',
      price: 5000,
      credits: 10,
      validityMonths: 6,
      dropInPrice: 600,
      description: 'Shareable with siblings, parents & friends',
      highlighted: false,
    },
    {
      packageType: PackageType.CLASS_20,
      label: '20 Class Pack',
      price: 8000,
      credits: 20,
      validityMonths: 12,
      dropInPrice: 600,
      description: 'Best value · Shareable with siblings, parents & friends',
      highlighted: true,
    },
    // Regular Camp
    {
      packageType: PackageType.CAMP_REGULAR_10,
      label: '10 Days Regular Camp',
      price: 10000,
      credits: 10,
      validityMonths: 8,
      dropInPrice: 1100,
      description: 'Shareable with siblings & friends',
      highlighted: false,
    },
    {
      packageType: PackageType.CAMP_REGULAR_20,
      label: '20 Days Regular Camp',
      price: 18000,
      credits: 20,
      validityMonths: 16,
      dropInPrice: 1100,
      description: 'Best value · Shareable with siblings & friends',
      highlighted: true,
    },
    // Extended Camp
    {
      packageType: PackageType.CAMP_EXTENDED_10,
      label: '10 Days Extended Camp',
      price: 11000,
      credits: 10,
      validityMonths: 8,
      dropInPrice: 1300,
      description: 'Shareable with siblings & friends',
      highlighted: false,
    },
    {
      packageType: PackageType.CAMP_EXTENDED_20,
      label: '20 Days Extended Camp',
      price: 20000,
      credits: 20,
      validityMonths: 16,
      dropInPrice: 1300,
      description: 'Best value · Shareable with siblings & friends',
      highlighted: true,
    },
  ]

  for (const p of prices) {
    await prisma.packagePrice.upsert({
      where: { id: prices.indexOf(p) + 1 },
      update: p,
      create: p,
    })
  }

  console.log('✅ Pricing: 6 package types seeded')

  // ─── SESSIONS — SATHORN ─────────────────────────────────
  const sathornSessions = [
    // Weekdays
    { name: 'Ninja Academy', sessionType: SessionType.NINJA_CLASS, creditType: CreditType.CLASS, dayOfWeek: 1, startTime: '15:30', endTime: '17:00' },  // Monday
    { name: 'Ninja Academy', sessionType: SessionType.NINJA_CLASS, creditType: CreditType.CLASS, dayOfWeek: 2, startTime: '16:00', endTime: '17:00' },  // Tuesday
    { name: 'BJJ Combo',     sessionType: SessionType.BJJ_COMBO,   creditType: CreditType.CLASS, dayOfWeek: 2, startTime: '17:00', endTime: '18:00' },  // Tuesday BJJ
    { name: 'Ninja Academy', sessionType: SessionType.NINJA_CLASS, creditType: CreditType.CLASS, dayOfWeek: 3, startTime: '16:00', endTime: '17:30' },  // Wednesday
    { name: 'Ninja Academy', sessionType: SessionType.NINJA_CLASS, creditType: CreditType.CLASS, dayOfWeek: 4, startTime: '16:00', endTime: '17:00' },  // Thursday
    { name: 'BJJ Combo',     sessionType: SessionType.BJJ_COMBO,   creditType: CreditType.CLASS, dayOfWeek: 4, startTime: '17:00', endTime: '18:00' },  // Thursday BJJ
    { name: 'Ninja Academy', sessionType: SessionType.NINJA_CLASS, creditType: CreditType.CLASS, dayOfWeek: 5, startTime: '17:00', endTime: '18:30' },  // Friday
    // Saturday
    { name: 'Ninja Academy (Morning)',  sessionType: SessionType.NINJA_CLASS,  creditType: CreditType.CLASS, dayOfWeek: 6, startTime: '09:30', endTime: '10:30' },
    { name: 'BJJ Combo (Morning)',      sessionType: SessionType.BJJ_COMBO,    creditType: CreditType.CLASS, dayOfWeek: 6, startTime: '10:30', endTime: '11:30' },
    { name: 'Ninja Academy (Afternoon)',sessionType: SessionType.NINJA_CLASS,  creditType: CreditType.CLASS, dayOfWeek: 6, startTime: '12:30', endTime: '14:30' },
    { name: 'Regular Ninja Camp',       sessionType: SessionType.CAMP_REGULAR, creditType: CreditType.CAMP,  dayOfWeek: 6, startTime: '09:30', endTime: '14:30', includeLunch: true },
    // Sunday
    { name: 'Ninja Academy (Morning)',  sessionType: SessionType.NINJA_CLASS,  creditType: CreditType.CLASS, dayOfWeek: 0, startTime: '09:30', endTime: '11:30' },
    { name: 'Ninja Academy (Afternoon)',sessionType: SessionType.NINJA_CLASS,  creditType: CreditType.CLASS, dayOfWeek: 0, startTime: '12:30', endTime: '14:30' },
    { name: 'Regular Ninja Camp',       sessionType: SessionType.CAMP_REGULAR, creditType: CreditType.CAMP,  dayOfWeek: 0, startTime: '09:30', endTime: '14:30', includeLunch: true },
  ]

  for (const s of sathornSessions) {
    await prisma.session.create({
      data: { ...s, locationId: sathorn.id, includeLunch: s.includeLunch ?? false },
    })
  }

  console.log('✅ Sessions: Sathorn schedule seeded')

  // ─── SESSIONS — EKAMAI ──────────────────────────────────
  const ekamaiSessions = [
    // Weekdays (booking only)
    { name: 'Ninja Academy', sessionType: SessionType.NINJA_CLASS, creditType: CreditType.CLASS, dayOfWeek: 2, startTime: '17:00', endTime: '18:30' },  // Tuesday
    { name: 'Ninja Academy', sessionType: SessionType.NINJA_CLASS, creditType: CreditType.CLASS, dayOfWeek: 3, startTime: '16:30', endTime: '18:00' },  // Wednesday
    { name: 'Ninja Academy', sessionType: SessionType.NINJA_CLASS, creditType: CreditType.CLASS, dayOfWeek: 4, startTime: '17:00', endTime: '18:30' },  // Thursday
    { name: 'Ninja Academy', sessionType: SessionType.NINJA_CLASS, creditType: CreditType.CLASS, dayOfWeek: 5, startTime: '17:00', endTime: '18:30' },  // Friday
    // Saturday
    { name: 'Ninja Academy (Morning)',  sessionType: SessionType.NINJA_CLASS,  creditType: CreditType.CLASS, dayOfWeek: 6, startTime: '09:30', endTime: '11:30' },
    { name: 'Ninja Academy (Afternoon)',sessionType: SessionType.NINJA_CLASS,  creditType: CreditType.CLASS, dayOfWeek: 6, startTime: '12:30', endTime: '14:30' },
    { name: 'Regular Ninja Camp',       sessionType: SessionType.CAMP_REGULAR, creditType: CreditType.CAMP,  dayOfWeek: 6, startTime: '09:30', endTime: '14:30', includeLunch: true },
    // Sunday
    { name: 'Ninja Academy (Morning)',  sessionType: SessionType.NINJA_CLASS,  creditType: CreditType.CLASS, dayOfWeek: 0, startTime: '09:30', endTime: '11:30' },
    { name: 'Ninja Academy (Afternoon)',sessionType: SessionType.NINJA_CLASS,  creditType: CreditType.CLASS, dayOfWeek: 0, startTime: '12:30', endTime: '14:30' },
    { name: 'Regular Ninja Camp',       sessionType: SessionType.CAMP_REGULAR, creditType: CreditType.CAMP,  dayOfWeek: 0, startTime: '09:30', endTime: '14:30', includeLunch: true },
  ]

  for (const s of ekamaiSessions) {
    await prisma.session.create({
      data: { ...s, locationId: ekamai.id, includeLunch: s.includeLunch ?? false },
    })
  }

  console.log('✅ Sessions: Ekamai schedule seeded')

  // ─── SETTINGS ───────────────────────────────────────────
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      promptpayNumber: '',
      whatsappNumber: '',
      promptpayQrUrl: '',
    },
  })

  console.log('✅ Settings: initialized')
  console.log('\n🎉 Seed complete!')
  console.log('   Super admin : damien@ninja.academy / changeme')
  console.log('   Manager     : manager@ninja.academy / changeme')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
