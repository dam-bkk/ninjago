{\rtf1\ansi\ansicpg1252\cocoartf2869
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 Build COMPLETE Ninja Track MVP : Mobile-first SaaS kids activity centers\
\
**TECH STACK** :\
- Next.js 15 App Router + TailwindCSS + TypeScript\
- Prisma + PostgreSQL \
- Socket.io real-time (rooms par location/date)\
- PWA mobile-first (QR scan)\
- Docker Compose (OCI deployment)\
\
**SCHEMA PRISMA complet** (copie-colle) :\
\
generator client \{\
  provider = "prisma-client-js"\
\}\
\
datasource db \{\
  provider = "postgresql"\
  url      = env("DATABASE_URL")\
\}\
\
model Location \{\
  id      Int      @id @default(autoincrement())\
  name    String\
  address String?\
  \
  students   Student[]\
  users      User[]\
  reservations Reservation[]\
  schedules  Schedule[]\
  coaches    Coach[]\
  events     Event[]\
\}\
\
model User \{\
  id          Int      @id @default(autoincrement())\
  email       String   @unique\
  phone       String?\
  role        Role     @default(MANAGER)\
  locationId  Int?\
  \
  location    Location? @relation(fields: [locationId], references: [id])\
  coach       Coach?\
\}\
\
model Parent \{\
  id     Int       @id @default(autoincrement())\
  phone  String    @unique\
  name   String?\
  \
  students Student[]\
\}\
\
model Student \{\
  id         Int       @id @default(autoincrement())\
  parentId   Int?\
  name       String\
  age        Int\
  photoUrl   String?\
  locationId Int\
  \
  parent     Parent?    @relation(fields: [parentId], references: [id])\
  location   Location   @relation(fields: [locationId], references: [id])\
  packages   Package[]\
  reservations Reservation[]\
  ledger     Ledger[]\
  attendance Attendance[]\
\}\
\
model Package \{\
  id            Int      @id @default(autoincrement())\
  studentId     Int\
  type          PackageType\
  credits       Int      @default(0)\
  creditStatus  CreditStatus @default(OK)\
  createdAt     DateTime @default(now())\
  \
  student       Student   @relation(fields: [studentId], references: [id])\
  payments      Payment[]\
  ledger        Ledger[]\
\}\
\
model Reservation \{\
  id                  Int      @id @default(autoincrement())\
  studentId           Int\
  date                DateTime\
  timeSlot            String\
  locationId          Int\
  status              ReservationStatus @default(EXPECTED)\
  creditStatusSnapshot String?\
  createdAt           DateTime @default(now())\
  \
  student             Student  @relation(fields: [studentId], references: [id])\
  location            Location @relation(fields: [locationId], references: [id])\
\}\
\
model Attendance \{\
  id         Int      @id @default(autoincrement())\
  studentId  Int\
  date       DateTime\
  timeSlot   String?\
  locationId Int\
  coachId    Int?\
  lunch      Boolean  @default(false)\
  \
  student    Student  @relation(fields: [studentId], references: [id])\
  location   Location @relation(fields: [locationId], references: [id])\
  coach      User?    @relation(fields: [coachId], references: [id])\
\}\
\
model Ledger \{\
  id         Int      @id @default(autoincrement())\
  studentId  Int\
  packageId  Int\
  date       DateTime\
  locationId Int\
  coachId    Int?\
  lunch      Boolean  @default(false)\
  \
  student    Student  @relation(fields: [studentId], references: [id])\
  package    Package  @relation(fields: [packageId], references: [id])\
  location   Location @relation(fields: [locationId], references: [id])\
\}\
\
model CoachSession \{\
  id        Int      @id @default(autoincrement())\
  coachId   Int\
  locationId Int\
  room      String\
  clockIn   DateTime @default(now())\
  clockOut  DateTime?\
  \
  coach     User     @relation(fields: [coachId], references: [id])\
  location  Location @relation(fields: [locationId], references: [id])\
\}\
\
enum Role \{\
  COACH\
  MANAGER\
  ADMIN\
\}\
\
enum PackageType \{\
  TRIAL\
  DROPIN\
  PACK\
\}\
\
enum CreditStatus \{\
  OK\
  LOW\
  EMPTY\
\}\
\
enum ReservationStatus \{\
  EXPECTED\
  CHECKEDIN\
  NOSHOW\
\}\
\
**CORE FLOWS** (1-click mobile) :\
\
1. **COACH QR LOGIN** : Scan QR room \uc0\u8594  clock-in \u8594  join socket room \u8594  trombinoscope\
2. **CHECK-IN** : Search student \uc0\u8594  TAP \u8594  transaction (credit-1 + ledger + attendance)\
3. **MANAGER DASH** : Live coaches + expected/present + alerts\
\
**PAGES** :\
/ : Dashboard (role-based)\
/login-qr : QR scanner\
/trombinoscope/[location]/[date] : Grid live\
/child/[id] : History credits\
/api/clockin\
/api/checkin\
\
**REAL-TIME** :\
Socket.io rooms : `$\{locationId\}-$\{date\}`\
\
**IMPORT EXCEL** :\
prisma/seed.ts COPY CSV students/packages\
\
**DOCKER OCI** :\
docker-compose.yml (Postgres + Next.js)\
\
G\'e9n\'e8re **TOUS** les fichiers :\
- prisma/schema.prisma\
- prisma/seed.ts\
- lib/prisma.ts\
- server.js (Socket.io)\
- app/layout.tsx + globals.css Tailwind\
- app/page.tsx (dashboard)\
- app/trombinoscope/[location]/[date]/page.tsx\
- components/QRScanner.tsx\
- components/TrombinoscopeGrid.tsx\
- api/clockin/route.ts\
- api/checkin/route.ts\
- docker-compose.yml\
- .env.example\
- deploy.sh OCI compartment\
\
**Mobile-first PWA**, TypeScript strict, responsive grid.\
}