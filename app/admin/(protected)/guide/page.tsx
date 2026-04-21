import { BookOpen, Users, QrCode, CreditCard, CalendarDays, Sword, UserCog, Settings, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react'

// ─── Section helpers ──────────────────────────────────────────
function Section({ id, icon: Icon, color, title, children }: {
  id: string; icon: React.ElementType; color: string; title: string; children: React.ReactNode
}) {
  return (
    <section id={id} className="space-y-4 scroll-mt-8">
      <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: '#E2E8F0' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color + '20', border: `1.5px solid ${color}40` }}>
          <Icon size={18} strokeWidth={2.2} style={{ color }} />
        </div>
        <h2 className="font-display font-semibold text-xl" style={{ color: '#0A1628' }}>{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Steps({ items }: { items: { label: string; detail?: string }[] }) {
  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-black text-xs"
            style={{ background: '#0A1628', color: '#CCFF00' }}>
            {i + 1}
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: '#0A1628' }}>{item.label}</p>
            {item.detail && <p className="text-xs font-semibold mt-0.5" style={{ color: '#64748B' }}>{item.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

function InfoCard({ color, icon: Icon, title, children }: {
  color: string; icon: React.ElementType; title: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: color + '12', border: `1.5px solid ${color}30` }}>
      <div className="flex items-center gap-2">
        <Icon size={15} strokeWidth={2.5} style={{ color }} />
        <p className="font-bold text-sm" style={{ color }}>{title}</p>
      </div>
      <div className="text-sm font-semibold space-y-1" style={{ color: '#334155' }}>{children}</div>
    </div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black"
      style={{ background: color + '20', color, border: `1px solid ${color}40` }}>
      {label}
    </span>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
}

// ─── TOC anchor links ─────────────────────────────────────────
const TOC = [
  { id: 'overview',      label: 'Platform overview',    color: '#0A1628' },
  { id: 'registration',  label: 'New parent walk-in',   color: '#00C2E0' },
  { id: 'parent-portal', label: 'Parent portal',        color: '#CCFF00' },
  { id: 'checkin',       label: 'QR check-in',          color: '#00C2E0' },
  { id: 'coach',         label: 'Coach workflow',        color: '#FFB400' },
  { id: 'admin-ops',     label: 'Admin operations',     color: '#8B5CF6' },
  { id: 'schedule',      label: 'Schedule & sessions',  color: '#EC4899' },
  { id: 'packages',      label: 'Packages & payments',  color: '#22C55E' },
  { id: 'tips',          label: 'Tips & edge cases',    color: '#F97316' },
]

// ─── Page ─────────────────────────────────────────────────────
export default function GuidePage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#0A1628' }}>
            <BookOpen size={20} color="#CCFF00" />
          </div>
          <h1 className="font-display font-semibold text-3xl" style={{ color: '#0A1628' }}>Staff Guide</h1>
        </div>
        <p className="text-sm font-semibold" style={{ color: '#64748B' }}>
          Everything you need to know — from registering a new family to running a session.
        </p>
      </div>

      {/* Table of contents */}
      <div className="card p-5 mb-8">
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>Contents</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {TOC.map(({ id, label, color }) => (
            <a key={id} href={`#${id}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-slate-50"
              style={{ color: '#334155' }}>
              <ChevronRight size={13} style={{ color }} />
              {label}
            </a>
          ))}
        </div>
      </div>

      <div className="space-y-12">

        {/* ── 1. OVERVIEW ── */}
        <Section id="overview" icon={BookOpen} color="#0A1628" title="Platform overview">
          <p className="text-sm font-semibold leading-relaxed" style={{ color: '#475569' }}>
            Ninja GO is the management system for Ninja Academy Bangkok (Sathorn + Ekamai). It has three sides:
          </p>
          <Grid>
            <InfoCard color="#00C2E0" icon={Users} title="Parent portal (ninjago.damien.asia/login)">
              <p>Parents book sessions, view their credit balance, generate QR codes for drop-off, request top-ups, and inquire about birthday parties.</p>
            </InfoCard>
            <InfoCard color="#FFB400" icon={Sword} title="Coach station (/admin → Coach view)">
              <p>Coaches clock in/out, see the day&apos;s expected students, mark attendance, and process drop-in payments.</p>
            </InfoCard>
            <InfoCard color="#8B5CF6" icon={UserCog} title="Admin dashboard (/admin)">
              <p>Full control — students, packages, schedule, events, cashflow, birthday inquiries, staff accounts, and settings.</p>
            </InfoCard>
            <InfoCard color="#22C55E" icon={CreditCard} title="Three credit types">
              <p><strong>Class</strong> — ninja/BJJ classes. <strong>Camp</strong> — regular camp 9am–1pm. <strong>Extended</strong> — camp 9am–2:30pm. Credits never mix between types.</p>
            </InfoCard>
          </Grid>
        </Section>

        {/* ── 2. NEW PARENT WALK-IN ── */}
        <Section id="registration" icon={Users} color="#00C2E0" title="New parent walk-in — step by step">
          <InfoCard color="#00C2E0" icon={CheckCircle2} title="Goal">
            <p>Register the child, create the parent account, and send them their login credentials so they can use the portal immediately.</p>
          </InfoCard>

          <Steps items={[
            {
              label: 'Go to Students → + Add student',
              detail: 'Admin dashboard → Students (top of page) → green "+ Add student" button.',
            },
            {
              label: 'Fill in the child\'s details',
              detail: 'First name + last name, date of birth (or age if unknown), location (Sathorn or Ekamai), and optionally a photo.',
            },
            {
              label: 'Enter the parent\'s phone number',
              detail: 'Type the phone number with country code (e.g. +66812345678). The system checks if that number already has an account.',
            },
            {
              label: 'New parent: set their name + PIN',
              detail: 'If the number is new, enter the parent\'s first name and generate a 4-digit PIN (use the Generate button). Note the PIN — you\'ll share it with them.',
            },
            {
              label: 'Existing parent: just confirm',
              detail: 'If the number already exists (sibling), the system links the new child to their account. No new PIN needed.',
            },
            {
              label: 'Click "Register student"',
              detail: 'The student profile and parent account are created instantly.',
            },
            {
              label: 'Send the welcome message',
              detail: 'A pre-written message appears with their phone number, PIN, and portal link. Tap WhatsApp or LINE to send it in one tap.',
            },
            {
              label: 'Add a package if they\'re paying today',
              detail: 'Go to the student\'s profile → "+ Add package" → pick the package they purchased → confirm payment method.',
            },
          ]} />

          <InfoCard color="#F97316" icon={AlertCircle} title="Important">
            <p>The PIN is the parent&apos;s password. Write it down for them or send it via WhatsApp/LINE immediately. If they lose it, you can reset it from the student&apos;s profile page → Reset PIN button.</p>
          </InfoCard>
        </Section>

        {/* ── 3. PARENT PORTAL ── */}
        <Section id="parent-portal" icon={Users} color="#CCFF00" title="What parents can do in the portal">
          <p className="text-sm font-semibold" style={{ color: '#475569' }}>
            The parent portal is at <span className="font-black" style={{ color: '#0A1628' }}>ninjago.damien.asia</span>. Parents log in with their phone number and 4-digit PIN.
          </p>
          <Grid>
            <div className="card p-4 space-y-3">
              <p className="font-bold text-sm" style={{ color: '#0A1628' }}>Home screen</p>
              <ul className="space-y-1.5">
                {[
                  'Credit balances (class / camp / extended)',
                  'Book a session button',
                  'QR check-in generator',
                  'Top Up card',
                  'Upcoming events',
                ].map(t => (
                  <li key={t} className="flex items-start gap-2 text-xs font-semibold" style={{ color: '#475569' }}>
                    <CheckCircle2 size={13} strokeWidth={2.5} className="shrink-0 mt-0.5" style={{ color: '#22C55E' }} />{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-4 space-y-3">
              <p className="font-bold text-sm" style={{ color: '#0A1628' }}>Booking a session</p>
              <Steps items={[
                { label: 'Tap "Book a session"' },
                { label: 'Pick the session type (class/camp)' },
                { label: 'Pick the date' },
                { label: 'Confirm — 1 credit deducted immediately' },
              ]} />
            </div>
            <div className="card p-4 space-y-3">
              <p className="font-bold text-sm" style={{ color: '#0A1628' }}>Schedule tab</p>
              <p className="text-xs font-semibold" style={{ color: '#475569' }}>
                Parents see their upcoming reservations in a week/month calendar. They can cancel a booking — the credit is returned automatically.
              </p>
            </div>
            <div className="card p-4 space-y-3">
              <p className="font-bold text-sm" style={{ color: '#0A1628' }}>Top Up tab</p>
              <p className="text-xs font-semibold" style={{ color: '#475569' }}>
                Shows the package catalog with prices. Parent taps a package → sees the PromptPay QR + a WhatsApp link to notify the academy. <strong>You must manually add the package after receiving payment.</strong>
              </p>
            </div>
          </Grid>
        </Section>

        {/* ── 4. QR CHECK-IN ── */}
        <Section id="checkin" icon={QrCode} color="#00C2E0" title="QR check-in — how it works">
          <p className="text-sm font-semibold" style={{ color: '#475569' }}>
            The QR check-in lets a nanny, guardian, or parent scan a code at the door instead of needing the parent&apos;s phone. 1 credit is reserved the moment the QR is generated.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-4 space-y-3">
              <p className="font-bold text-sm" style={{ color: '#00C2E0' }}>Parent side — generating the QR</p>
              <Steps items={[
                { label: 'Open the portal → home screen → "QR Check-in"' },
                { label: 'Select the child' },
                { label: 'Select the session' },
                { label: 'Select the package to use' },
                { label: 'QR appears — 1 credit deducted immediately' },
                { label: 'Share the QR or let the guardian scan it at drop-off' },
              ]} />
            </div>
            <div className="card p-4 space-y-3">
              <p className="font-bold text-sm" style={{ color: '#FFB400' }}>Staff side — scanning the QR</p>
              <Steps items={[
                { label: 'Go to /scan or use the Coach view scan button' },
                { label: 'Scan the QR code shown on the guardian\'s phone' },
                { label: 'Confirm screen shows: child name, session, credits remaining' },
                { label: 'Tap "Check in" — attendance is recorded, ledger updated' },
              ]} />
            </div>
          </div>

          <InfoCard color="#22C55E" icon={CheckCircle2} title="Key rules">
            <ul className="space-y-1">
              <li>• Each QR is single-use and expires at midnight on the session date.</li>
              <li>• The credit is deducted at QR generation — not at scan time.</li>
              <li>• If a QR expires unused, the credit stays deducted (contact admin to refund manually).</li>
              <li>• A new QR for the same student + session + date reuses the existing token.</li>
            </ul>
          </InfoCard>
        </Section>

        {/* ── 5. COACH WORKFLOW ── */}
        <Section id="coach" icon={Sword} color="#FFB400" title="Coach daily workflow">
          <Grid>
            <div className="card p-4 space-y-3">
              <p className="font-bold text-sm" style={{ color: '#0A1628' }}>Start of day</p>
              <Steps items={[
                { label: 'Log in at /admin/login with your email + password' },
                { label: 'Go to Coach view → Clock in', detail: 'Select your location. This starts your shift.' },
                { label: 'Review today\'s expected students', detail: 'The schedule shows who has booked and who is expected.' },
              ]} />
            </div>
            <div className="card p-4 space-y-3">
              <p className="font-bold text-sm" style={{ color: '#0A1628' }}>During the session</p>
              <Steps items={[
                { label: 'Mark attendance for each student who shows up', detail: 'Tick them off as they arrive.' },
                { label: 'For walk-in / drop-in students', detail: 'Select "Drop-in" → choose payment method → enter amount → confirm. No package needed.' },
                { label: 'Scan QR codes', detail: 'If a guardian presents a QR, scan it from the Coach view.' },
              ]} />
            </div>
          </Grid>
          <div className="card p-4 space-y-3">
            <p className="font-bold text-sm" style={{ color: '#0A1628' }}>End of day</p>
            <Steps items={[
              { label: 'Mark any no-shows', detail: 'Students who booked but didn\'t appear — mark as no-show. Their credit is NOT returned (policy decision).' },
              { label: 'Clock out in Coach view', detail: 'Ends your shift. Total hours are logged.' },
            ]} />
          </div>
          <InfoCard color="#FFB400" icon={AlertCircle} title="Coach access">
            <p>Coaches can only see their assigned location. They cannot view financial reports, edit packages, or access other locations&apos; data.</p>
          </InfoCard>
        </Section>

        {/* ── 6. ADMIN OPERATIONS ── */}
        <Section id="admin-ops" icon={UserCog} color="#8B5CF6" title="Admin operations">
          <Grid>
            <div className="card p-4 space-y-2">
              <p className="font-bold text-sm" style={{ color: '#0A1628' }}>Add a package to a student</p>
              <p className="text-xs font-semibold" style={{ color: '#475569' }}>
                Students → profile → &quot;+ Add package&quot; → select package type → enter price paid → payment method → Save. Credits appear immediately on the parent portal.
              </p>
            </div>
            <div className="card p-4 space-y-2">
              <p className="font-bold text-sm" style={{ color: '#0A1628' }}>Reset a parent&apos;s PIN</p>
              <p className="text-xs font-semibold" style={{ color: '#475569' }}>
                Students → profile → &quot;Reset PIN&quot; button → generate or type new PIN → Save. A shareable WhatsApp/LINE message appears automatically.
              </p>
            </div>
            <div className="card p-4 space-y-2">
              <p className="font-bold text-sm" style={{ color: '#0A1628' }}>Handle a top-up request</p>
              <p className="text-xs font-semibold" style={{ color: '#475569' }}>
                Parent sends payment (PromptPay/cash/transfer) → confirm receipt → go to their student&apos;s profile → &quot;+ Add package&quot; → select the package they paid for.
              </p>
            </div>
            <div className="card p-4 space-y-2">
              <p className="font-bold text-sm" style={{ color: '#0A1628' }}>Manage birthday inquiries</p>
              <p className="text-xs font-semibold" style={{ color: '#475569' }}>
                Admin → Birthdays → see all pending inquiries with kid details, preferred date, guest count. Update status to Confirmed or Cancelled after contacting the family.
              </p>
            </div>
            <div className="card p-4 space-y-2">
              <p className="font-bold text-sm" style={{ color: '#0A1628' }}>Delete a student (testing only)</p>
              <p className="text-xs font-semibold" style={{ color: '#475569' }}>
                Students → profile → red &quot;Delete&quot; button. Permanently deletes all attendance, packages, and history. Use only during setup/testing — this cannot be undone.
              </p>
            </div>
            <div className="card p-4 space-y-2">
              <p className="font-bold text-sm" style={{ color: '#0A1628' }}>Update academy settings</p>
              <p className="text-xs font-semibold" style={{ color: '#475569' }}>
                Admin → Settings → update PromptPay number, PromptPay QR image, and WhatsApp contact number. These appear on the parent Top Up screen.
              </p>
            </div>
          </Grid>
        </Section>

        {/* ── 7. SCHEDULE ── */}
        <Section id="schedule" icon={CalendarDays} color="#EC4899" title="Schedule & sessions">
          <Grid>
            <div className="card p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-sm" style={{ color: '#0A1628' }}>Recurring sessions</p>
                <Badge label="REGULAR" color="#00C2E0" />
              </div>
              <p className="text-xs font-semibold" style={{ color: '#475569' }}>
                Normal weekly classes. Go to Schedule → Settings → &quot;+ Add session&quot;. Set day of week, time, location, credit type, and max capacity. These repeat every week unless overridden.
              </p>
            </div>
            <div className="card p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-sm" style={{ color: '#0A1628' }}>One-off events</p>
                <Badge label="EVENT" color="#EC4899" />
              </div>
              <p className="text-xs font-semibold" style={{ color: '#475569' }}>
                Camps, special days, competitions. Admin → Events → &quot;+ Add event&quot;. Set a specific date (not recurring). These appear on the parent schedule with their description.
              </p>
            </div>
            <div className="card p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-sm" style={{ color: '#0A1628' }}>Calendar overrides</p>
                <Badge label="VACATION" color="#F97316" />
              </div>
              <p className="text-xs font-semibold" style={{ color: '#475569' }}>
                Mark a date as VACATION or SPECIAL. Schedule → Settings → Calendrier tab. Regular sessions are hidden on vacation days; vacation-type sessions are shown instead.
              </p>
            </div>
            <div className="card p-4 space-y-2">
              <p className="font-bold text-sm" style={{ color: '#0A1628' }}>Birthday party slots</p>
              <p className="text-xs font-semibold" style={{ color: '#475569' }}>
                Admin → Birthdays → Manage slots. Pre-define available weekend slots for the year. Parents see these in the birthday inquiry form and can pick a preferred date.
              </p>
            </div>
          </Grid>
        </Section>

        {/* ── 8. PACKAGES ── */}
        <Section id="packages" icon={CreditCard} color="#22C55E" title="Packages & payments">
          <div className="card p-5 space-y-4">
            <p className="font-bold text-sm" style={{ color: '#0A1628' }}>Package types</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-semibold border-collapse">
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                    <th className="text-left py-2 pr-4" style={{ color: '#94A3B8' }}>Type</th>
                    <th className="text-left py-2 pr-4" style={{ color: '#94A3B8' }}>Credit type</th>
                    <th className="text-left py-2 pr-4" style={{ color: '#94A3B8' }}>Credits</th>
                    <th className="text-left py-2" style={{ color: '#94A3B8' }}>Use for</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['CLASS × 10 / 20',          'Class',    '10 or 20', 'Ninja class, BJJ combo'],
                    ['CAMP REGULAR × 10 / 20',   'Camp',     '10 or 20', 'Camp 9am–1pm'],
                    ['CAMP EXTENDED × 10 / 20',  'Extended', '10 or 20', 'Camp 9am–2:30pm'],
                  ].map(([type, credit, credits, use]) => (
                    <tr key={type} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td className="py-2 pr-4 font-black" style={{ color: '#0A1628' }}>{type}</td>
                      <td className="py-2 pr-4">
                        <Badge label={credit} color={credit === 'Class' ? '#00C2E0' : credit === 'Camp' ? '#CCFF00' : '#FFB400'} />
                      </td>
                      <td className="py-2 pr-4" style={{ color: '#475569' }}>{credits}</td>
                      <td className="py-2" style={{ color: '#475569' }}>{use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Grid>
            <InfoCard color="#22C55E" icon={CheckCircle2} title="Credit rules">
              <ul className="space-y-1">
                <li>• Credits are deducted when booking OR when QR is generated — whichever comes first.</li>
                <li>• Credits never cross types (class credits can&apos;t pay for camp sessions).</li>
                <li>• A package can be shared between siblings — set the &quot;Shared with&quot; label when adding.</li>
                <li>• The PRIMARY package is the one used by default for QR check-in.</li>
              </ul>
            </InfoCard>
            <InfoCard color="#8B5CF6" icon={Settings} title="Adjusting the package catalog">
              <p>Admin → Packages to add, edit, or deactivate package types. Deactivating a type hides it from the &quot;Add package&quot; modal — it does not affect existing packages.</p>
            </InfoCard>
          </Grid>
        </Section>

        {/* ── 9. TIPS ── */}
        <Section id="tips" icon={AlertCircle} color="#F97316" title="Tips & edge cases">
          <div className="space-y-3">
            {[
              {
                q: 'A parent forgot their PIN',
                a: 'Students → profile → "Reset PIN" → generate new PIN → send WhatsApp/LINE message. Takes 10 seconds.',
              },
              {
                q: 'A parent shows up without a booking (drop-in)',
                a: 'Process it in Coach view as a Drop-in payment. No package or credit needed — they pay cash/transfer on the spot.',
              },
              {
                q: 'A parent has 0 credits but wants to attend',
                a: 'Two options: (1) process as drop-in, or (2) add a new package first if they\'re buying one today.',
              },
              {
                q: 'A parent generated a QR but the session was cancelled',
                a: 'The credit was already deducted when the QR was created. Manually add 1 credit back by editing the package — or adjust usedCredits from the database.',
              },
              {
                q: 'Same phone number, two parents (divorced family, etc.)',
                a: 'Not supported — one phone = one account. Use the primary guardian\'s number and communicate PIN to both.',
              },
              {
                q: 'Sibling sharing a package',
                a: 'When adding the package, enter both names in the "Shared with" field (e.g. "Tom + Lisa"). Both children can draw from it.',
              },
              {
                q: 'Changing the PromptPay QR image',
                a: 'Admin → Settings → upload the new QR image. It appears on the parent Top Up screen immediately.',
              },
              {
                q: 'A session runs differently on school holidays',
                a: 'Admin → Schedule → Settings → Calendrier tab → add a Calendar Override for that date (VACATION or SPECIAL). The right session type will show automatically.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="card p-4">
                <p className="font-bold text-sm mb-1" style={{ color: '#0A1628' }}>Q: {q}</p>
                <p className="text-xs font-semibold" style={{ color: '#475569' }}>→ {a}</p>
              </div>
            ))}
          </div>
        </Section>

      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t text-center" style={{ borderColor: '#E2E8F0' }}>
        <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
          Ninja Academy · Staff guide · Last updated April 2026
        </p>
      </div>

    </div>
  )
}
