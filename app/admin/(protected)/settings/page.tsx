'use client'

import { useState, useEffect } from 'react'
import { Check, Loader2 } from 'lucide-react'

type Settings = {
  promptpayNumber: string
  whatsappNumber: string
  promptpayQrUrl: string
}

type SaveState = 'idle' | 'saving' | 'saved'

function Field({
  label, hint, value, placeholder, onChange,
}: {
  label: string
  hint?: string
  value: string
  placeholder: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input w-full"
      />
      {hint && <p className="text-xs font-semibold" style={{ color: '#CBD5E1' }}>{hint}</p>}
    </div>
  )
}

export default function SettingsPage() {
  const [form, setForm]     = useState<Settings>({ promptpayNumber: '', whatsappNumber: '', promptpayQrUrl: '' })
  const [save, setSave]     = useState<SaveState>('idle')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => { setForm(d.settings); setLoading(false) })
  }, [])

  const set = (k: keyof Settings) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    setSave('saving')
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSave('saved')
    setTimeout(() => setSave('idle'), 2000)
  }

  if (loading) return (
    <div className="p-8 flex items-center gap-2" style={{ color: '#94A3B8' }}>
      <Loader2 size={16} className="animate-spin" /> Loading…
    </div>
  )

  return (
    <div className="p-4 sm:p-8 max-w-xl space-y-8">
      <div>
        <h1 className="font-display font-semibold text-2xl" style={{ color: '#0A1628' }}>Settings</h1>
        <p className="text-sm font-semibold mt-1" style={{ color: '#94A3B8' }}>General configuration</p>
      </div>

      {/* Payments */}
      <div className="card p-6 space-y-5">
        <h2 className="font-display font-semibold text-base" style={{ color: '#0A1628' }}>Payments</h2>
        <Field
          label="PromptPay number"
          hint="Phone number or tax ID linked to the QR code"
          value={form.promptpayNumber}
          placeholder="0812345678"
          onChange={set('promptpayNumber')}
        />
        <Field
          label="PromptPay QR URL"
          hint="Direct link to the QR image shown to parents"
          value={form.promptpayQrUrl}
          placeholder="https://cdn.example.com/promptpay-qr.png"
          onChange={set('promptpayQrUrl')}
        />
      </div>

      {/* Contact */}
      <div className="card p-6 space-y-5">
        <h2 className="font-display font-semibold text-base" style={{ color: '#0A1628' }}>Contact</h2>
        <Field
          label="WhatsApp number"
          hint="With country code, no spaces — e.g. +66812345678"
          value={form.whatsappNumber}
          placeholder="+66812345678"
          onChange={set('whatsappNumber')}
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={save === 'saving'}
        className="btn font-bold flex items-center gap-2"
        style={{ background: save === 'saved' ? '#22C55E' : '#0A1628', color: save === 'saved' ? '#fff' : '#CCFF00' }}>
        {save === 'saving' && <Loader2 size={15} className="animate-spin" />}
        {save === 'saved'  && <Check size={15} />}
        {save === 'saving' ? 'Saving…' : save === 'saved' ? 'Saved' : 'Save'}
      </button>
    </div>
  )
}
