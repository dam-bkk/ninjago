# Ninja GO — Architecture

## Overview

Two-location kids ninja/parkour SaaS.
Staff (coaches + admin) manage sessions, check-ins, packages.
Parents access a lightweight portal (no account, phone+PIN).

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── STAFF ────────────────────────────────────────────────

model User {
  id         Int      @id @default(autoincrement())
  email      String   @unique
  name       String
  phone      String?
  role       Role     @default(COACH)
  locationId Int?     // primary location for coach
  active     Boolean  @default(true)
  createdAt  DateTime @default(now())

  location      Location?      @relation(fields: [locationId], references: [id])
  coachSessions CoachSession[]
  attendance    Attendance[]
}

// ─── LOCATIONS ────────────────────────────────────────────

model Location {
  id      Int     @id @default(autoincrement())
  name    String  // "Sathorn" | "Ekamai"
  address String?
  qrToken String  @unique @default(cuid()) // static QR clock-in token

  users         User[]
  sessions      Session[]
  reservations  Reservation[]
  attendance    Attendance[]
  coachSessions CoachSession[]
  studentAccess StudentLocation[]
}

// ─── PARENTS ──────────────────────────────────────────────

model Parent {
  id           Int      @id @default(autoincrement())
  phone        String   @unique  // +66812345678 — login identifier
  name         String?
  email        String?
  pinHash      String            // bcrypt hash of 4-digit PIN
  bookingToken String   @unique  @default(cuid()) // direct link access
  createdAt    DateTime @default(now())

  students Student[]
}

// ─── STUDENTS ─────────────────────────────────────────────

model Student {
  id          Int       @id @default(autoincrement())
  name        String
  age         Int
  photoUrl    String?   // captured from camera on profile creation
  parentId    Int?
  graduated   Boolean   @default(false)  // Junior Ninja graduation
  graduatedAt DateTime?
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())

  parent       Parent?           @relation(fields: [parentId], references: [id])
  locations    StudentLocation[] // accessible locations (1 before graduation, 2 after)
  packages     StudentPackage[]  // own + shared packages
  reservations Reservation[]
  attendance   Attendance[]
  ledger       LedgerEntry[]
}

// Locations accessible by a student
model StudentLocation {
  studentId  Int
  locationId Int

  student  Student  @relation(fields: [studentId], references: [id])
  location Location @relation(fields: [locationId], references: [id])

  @@id([studentId, locationId])
}

// ─── PACKAGES ─────────────────────────────────────────────

model Package {
  id           Int         @id @default(autoincrement())
  type         PackageType
  creditType   CreditType  // CLASS or CAMP — NOT interchangeable
  totalCredits Int         // 10 or 20
  usedCredits  Int         @default(0)
  pricePaid    Int         // THB
  purchasedAt  DateTime    @default(now())
  expiresAt    DateTime?   // calculated at creation from PackagePrice.validityDays
  groupLabel   String?     // e.g. "Famille Martin", "Tom & Lisa"
  notes        String?

  holders  StudentPackage[]
  payments Payment[]
  ledger   LedgerEntry[]
}

// Who can use which package (sharing between siblings/friends)
model StudentPackage {
  studentId Int
  packageId Int
  isPrimary Boolean  @default(false) // true = the buyer
  addedAt   DateTime @default(now())

  student Student @relation(fields: [studentId], references: [id])
  package Package @relation(fields: [packageId], references: [id])

  @@id([studentId, packageId])
}

// ─── SESSIONS (schedule templates) ────────────────────────

model Session {
  id           Int         @id @default(autoincrement())
  locationId   Int
  name         String      // "Ninja Academy", "BJJ Combo", "Regular Camp"
  sessionType  SessionType
  creditType   CreditType  // which credit type it consumes
  dayOfWeek    Int?        // 0=Sun…6=Sat, null = special event
  startTime    String      // "09:30"
  endTime      String      // "14:30"
  includeLunch Boolean     @default(false)
  periodType   PeriodType  @default(REGULAR)
  validFrom    DateTime?   // for special events (Songkran: April 1)
  validUntil   DateTime?   // end of special event
  maxCapacity  Int?
  active       Boolean     @default(true)

  location     Location      @relation(fields: [locationId], references: [id])
  reservations Reservation[]
}

// ─── RESERVATIONS ─────────────────────────────────────────

model Reservation {
  id         Int               @id @default(autoincrement())
  studentId  Int
  sessionId  Int
  locationId Int
  date       DateTime          @db.Date
  status     ReservationStatus @default(EXPECTED)
  createdAt  DateTime          @default(now())

  student    Student    @relation(fields: [studentId], references: [id])
  session    Session    @relation(fields: [sessionId], references: [id])
  location   Location   @relation(fields: [locationId], references: [id])
  attendance Attendance?
}

// ─── ATTENDANCE + CHECK-IN ────────────────────────────────

model Attendance {
  id            Int      @id @default(autoincrement())
  studentId     Int
  reservationId Int?     @unique
  locationId    Int
  coachId       Int?
  date          DateTime @db.Date
  checkedInAt   DateTime @default(now())
  lunch         Boolean  @default(false)
  isDropIn      Boolean  @default(false)

  student     Student       @relation(fields: [studentId], references: [id])
  reservation Reservation?  @relation(fields: [reservationId], references: [id])
  location    Location      @relation(fields: [locationId], references: [id])
  coach       User?         @relation(fields: [coachId], references: [id])
  ledger      LedgerEntry?  // null if drop-in
  dropIn      DropInPayment?
}

// Drop-in payment (no package involved)
model DropInPayment {
  id           Int           @id @default(autoincrement())
  attendanceId Int           @unique
  amount       Int           // 600 | 1100 | 1300 THB
  method       PaymentMethod
  paidAt       DateTime      @default(now())

  attendance Attendance @relation(fields: [attendanceId], references: [id])
}

// Immutable credit deduction log
model LedgerEntry {
  id           Int      @id @default(autoincrement())
  studentId    Int
  packageId    Int
  attendanceId Int      @unique
  creditsUsed  Int      @default(1)
  balanceAfter Int      // remaining credits in package after this entry
  createdAt    DateTime @default(now())

  student    Student    @relation(fields: [studentId], references: [id])
  package    Package    @relation(fields: [packageId], references: [id])
  attendance Attendance @relation(fields: [attendanceId], references: [id])
}

// ─── COACH CLOCK-IN ───────────────────────────────────────

model CoachSession {
  id         Int       @id @default(autoincrement())
  coachId    Int
  locationId Int
  clockIn    DateTime  @default(now())
  clockOut   DateTime?

  coach    User     @relation(fields: [coachId], references: [id])
  location Location @relation(fields: [locationId], references: [id])
}

// ─── PAYMENTS ─────────────────────────────────────────────

model Payment {
  id        Int           @id @default(autoincrement())
  packageId Int
  amount    Int           // THB
  method    PaymentMethod
  paidAt    DateTime      @default(now())
  notes     String?       // WhatsApp proof reference

  package Package @relation(fields: [packageId], references: [id])
}

// ─── PRICING (manager-configurable) ───────────────────────

model PackagePrice {
  id           Int         @id @default(autoincrement())
  packageType  PackageType
  label        String      // "20 Class Pack"
  price        Int         // THB
  credits      Int
  validityDays Int         // 180, 365, 240, 480...
  dropInPrice  Int?        // THB for drop-in of this category
  description  String?     // "Shareable · Best value"
  highlighted  Boolean     @default(false) // "Most Popular" badge
  active       Boolean     @default(true)
}

// ─── APP SETTINGS ─────────────────────────────────────────

model Settings {
  id               Int    @id @default(1)
  promptpayNumber  String @default("")
  whatsappNumber   String @default("") // "66812345678"
  promptpayQrUrl   String @default("") // uploaded image URL
}

// ─── ENUMS ────────────────────────────────────────────────

enum Role {
  SUPER_ADMIN
  ADMIN
  COACH
}

enum CreditType {
  CLASS
  CAMP
}

enum PackageType {
  CLASS_10
  CLASS_20
  CAMP_REGULAR_10
  CAMP_REGULAR_20
  CAMP_EXTENDED_10
  CAMP_EXTENDED_20
}

enum SessionType {
  NINJA_CLASS    // standard class
  BJJ_COMBO      // Ninja + BJJ = 1 credit (Sathorn only)
  CAMP_REGULAR   // all-day weekend / vacation regular (9h-13h)
  CAMP_EXTENDED  // vacation extended (9h-14h30)
}

enum PeriodType {
  REGULAR    // normal school week
  VACATION   // school holidays
  SPECIAL    // Songkran, etc.
}

enum ReservationStatus {
  EXPECTED
  CHECKED_IN
  NO_SHOW
  CANCELLED
}

enum PaymentMethod {
  CASH
  TRANSFER
  QR_PROMPTPAY
}
```

---

## Core Flows

### 1. Coach QR Clock-in
```
/display/[locationId] → shows static QR (public, no auth)
Coach scans → /api/coach/clockin { token, coachId }
Server: find location by qrToken → create CoachSession { clockIn }
Socket: emit "coach:arrived" to room locationId
```

### 2. Student Check-in (coach app)
```
Coach searches student by name
→ sees student profile + current packages + today's reservation
→ taps [Check-in]
→ server:
    1. find valid package (creditType match, not expired, credits remaining)
       → sort by expiresAt ASC (use expiring first)
    2. if no package → prompt drop-in payment
    3. create Attendance
    4. create LedgerEntry (package.usedCredits += 1, balanceAfter = remaining)
    5. update Reservation.status = CHECKED_IN if exists
→ Socket: emit "checkin" to room locationId → trombinoscope updates live
```

### 3. Drop-in Check-in
```
Coach taps [Drop-in]
→ selects session type (CLASS / CAMP_REGULAR / CAMP_EXTENDED)
→ amount shown (600 / 1100 / 1300 THB)
→ selects payment method
→ create Attendance { isDropIn: true }
→ create DropInPayment { amount, method }
→ NO LedgerEntry (no package)
```

### 4. Parent Login
```
/login → phone number + 4-digit PIN
POST /api/auth/parent { phone, pin }
→ find parent by phone
→ bcrypt.compare(pin, parent.pinHash)
→ set httpOnly cookie { token: parent.bookingToken, maxAge: ∞ }
→ redirect to /p/[token]
```

### 5. Parent Top-up
```
/p/[token]/pricing
→ lists all PackagePrices (active=true)
→ parent selects pack
→ shows PromptPay QR image + exact amount
→ [Send payment proof] → opens WhatsApp:
  wa.me/[whatsappNumber]?text=Recharge+[studentName]+[packageLabel]+[price]THB
→ manager receives WA → verifies → creates Package manually in admin
```

### 6. Visual Planning (from May)
```
/admin/planning → monthly calendar view
→ each day shows sessions at each location
→ click session → see enrolled students + attendance status
→ manager can add/edit sessions per period (REGULAR / VACATION / SPECIAL)
```

---

## Real-time (Socket.io)

Rooms: `location-{locationId}-{date}` (e.g. `location-1-2026-05-10`)

| Event | Emitter | Listeners |
|---|---|---|
| `coach:arrived` | server on clock-in | manager dashboard |
| `checkin` | server on check-in | trombinoscope, manager |
| `coach:left` | server on clock-out | manager dashboard |

---

## API Routes

### Auth
```
POST /api/auth/login          ← staff (email + password → JWT)
POST /api/auth/parent         ← parent (phone + PIN → cookie)
POST /api/auth/parent/logout  ← clear cookie
```

### Students
```
GET    /api/students
POST   /api/students
GET    /api/students/[id]
PATCH  /api/students/[id]
POST   /api/students/[id]/graduate
```

### Packages
```
GET    /api/packages?studentId=
POST   /api/packages          ← manager creates after WA payment proof
PATCH  /api/packages/[id]
GET    /api/packages/prices   ← public (parent portal)
PATCH  /api/packages/prices/[id]  ← manager updates
```

### Sessions / Planning
```
GET    /api/sessions?locationId=&date=&periodType=
POST   /api/sessions
PATCH  /api/sessions/[id]
DELETE /api/sessions/[id]
```

### Reservations
```
GET    /api/reservations?sessionId=&date=
POST   /api/reservations      ← coach or parent
DELETE /api/reservations/[id] ← cancel (no penalty)
```

### Attendance / Check-in
```
POST   /api/checkin           ← coach check-in (deducts credit)
GET    /api/attendance?locationId=&date=
```

### Coach
```
POST   /api/coach/clockin
POST   /api/coach/clockout
GET    /api/coach/sessions    ← coach's today schedule
```

### Admin / Dashboard
```
GET    /api/admin/dashboard   ← stats overview
GET    /api/admin/cashflow    ← monthly revenue breakdown
GET    /api/admin/students/new        ← new this month
GET    /api/admin/packages/expiring   ← expiring soon
```

### Parent portal
```
GET    /api/parent/me         ← from cookie token
GET    /api/parent/students   ← kids + packages
GET    /api/parent/planning   ← upcoming sessions for their kids
```

---

## Manager Dashboard Pages

| Page | Content |
|---|---|
| Overview | Active students, sessions today, coaches clocked in |
| Planning | Monthly calendar, session management |
| Students | List, profiles, packages, graduation |
| Coaches | Profiles, clock-in history, hours per month |
| Cashflow | Monthly revenue, drop-ins vs packages, new sales |
| Packages | Active packs, expiring soon, low credits alerts |
| Settings | PromptPay QR, WhatsApp number, pricing |

---

## Trombinoscope (coach view)

```
/coach/trombinoscope/[locationId]/[date]

Real-time grid of expected students
→ photo + name + credit status (OK / LOW / EMPTY)
→ tap to check-in instantly
→ Socket updates: new arrivals appear automatically
→ Color coding:
   GREEN  = checked in
   BLUE   = expected (reserved)
   GREY   = not yet arrived
   RED    = drop-in needed (no credits)
```

---

## Junior Ninja Graduation

```
Student created → assigned to Sathorn only (StudentLocation: Sathorn)
Manager clicks [Graduate] in student profile
→ Student.graduated = true, graduatedAt = now()
→ StudentLocation: add Ekamai
→ Student can now attend both locations
```

---

## Deployment (no Docker for now)

```
Local dev:
  PostgreSQL installed locally
  npm run dev (Next.js custom server with Socket.io)

Production (later):
  OCI VM
  PostgreSQL direct install or managed DB
  PM2 for process management
  nginx reverse proxy
  Docker added when ready
```

---

## Future (post-MVP)

- Dynamic HMAC QR codes (60s rotation) for coach clock-in
- Age limit alerts (configurable by manager)
- Export reports (PDF/CSV attendance, revenue)
- Push notifications (PWA)
- Automated package expiry warnings to parents
