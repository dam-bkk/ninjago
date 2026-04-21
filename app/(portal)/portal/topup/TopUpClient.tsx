'use client'

import { useLang, t } from '@/lib/lang-context'

type PackagePrice = {
  id: number; label: string; description: string | null
  packageType: string; credits: number; price: number
  validityMonths: number; dropInPrice: number | null
  highlighted: boolean
}
type Settings = {
  promptpayNumber: string | null
  promptpayQrUrl: string | null
  whatsappNumber: string | null
} | null

type GroupedPrices = Record<string, PackagePrice[]>

export default function TopUpClient({ grouped, settings }: { grouped: GroupedPrices; settings: Settings }) {
  const { lang } = useLang()
  const d = t(lang)

  const groupLabels: Record<string, string> = {
    'Class packs': lang === 'th' ? 'แพ็คเกจคลาส' : lang === 'fr' ? 'Packs cours' : 'Class packs',
    'Camp packs (9am–1pm)': lang === 'th' ? 'แพ็คเกจแคมป์ (9:00–13:00)' : lang === 'fr' ? 'Packs camp (9h–13h)' : 'Camp packs (9am–1pm)',
    'Extended camp (9am–2:30pm)': lang === 'th' ? 'แพ็คเกจแคมป์เต็มวัน (9:00–14:30)' : lang === 'fr' ? 'Camp journée complète (9h–14h30)' : 'Extended camp (9am–2:30pm)',
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-8 space-y-6 pb-4">
      <div>
        <h1 className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>{d.topUpTitle}</h1>
        <p className="text-sm font-semibold mt-0.5" style={{ color: 'rgba(10,22,40,0.50)' }}>{d.purchasePack}</p>
      </div>

      {Object.entries(grouped).map(([group, pkgs]) => pkgs.length === 0 ? null : (
        <div key={group} className="space-y-3">
          <p className="font-display font-semibold text-sm" style={{ color: '#0A1628', opacity: 0.5 }}>
            {groupLabels[group] ?? group}
          </p>
          {pkgs.map(p => {
            const color = p.packageType.startsWith('CLASS') ? '#00C2E0'
              : p.packageType.includes('EXTENDED') ? '#FFB400' : '#CCFF00'
            const savings = p.dropInPrice ? p.dropInPrice * p.credits - p.price : 0
            return (
              <div key={p.id} className="portal-card p-5 space-y-3"
                style={p.highlighted ? { borderLeft: `4px solid ${color}` } : {}}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display font-semibold" style={{ color: '#0A1628', fontSize: '1rem' }}>{p.label}</p>
                      {p.highlighted && (
                        <span className="tag" style={{ background: color, color: '#0A1628', fontSize: '0.6rem', padding: '0.15rem 0.55rem' }}>
                          {d.bestValue}
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-xs font-semibold mt-0.5" style={{ color: '#5B8FA8' }}>{p.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display font-semibold" style={{ color: '#0A1628', fontSize: '1.25rem' }}>
                      ฿{p.price.toLocaleString()}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                      {d.credits(p.credits)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span style={{ color: '#5B8FA8' }}>
                    {d.validMonths(p.validityMonths)}
                    {p.dropInPrice ? ` · ${d.dropIn(p.dropInPrice)}` : ''}
                  </span>
                  {p.dropInPrice && savings > 0 && (
                    <span className="font-bold px-2 py-0.5 rounded-lg"
                      style={{ background: '#DCFCE7', color: '#16A34A' }}>
                      {d.save(savings)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* Contact to purchase */}
      <div className="portal-card-dark p-5 space-y-4">
        <p className="font-display font-semibold text-white">{d.howToPurchase}</p>
        <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {d.contactToPurchase}
        </p>

        {settings?.promptpayQrUrl && (
          <div className="rounded-2xl overflow-hidden p-4 flex flex-col items-center gap-2"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>
              PromptPay QR
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.promptpayQrUrl}
              alt="PromptPay QR code"
              className="rounded-xl"
              style={{ width: '200px', height: '200px', objectFit: 'contain', background: '#fff', padding: '8px' }}
            />
            {settings.promptpayNumber && (
              <p className="text-xs font-bold text-white">{settings.promptpayNumber}</p>
            )}
          </div>
        )}

        {settings?.whatsappNumber && (
          <a
            href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ninja w-full font-display flex items-center justify-center gap-2"
            style={{ fontSize: '0.95rem', fontWeight: 600 }}
          >
            {d.contactWhatsApp}
          </a>
        )}
        {!settings?.whatsappNumber && !settings?.promptpayQrUrl && (
          <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {d.askCoach}
          </p>
        )}
      </div>
    </div>
  )
}
