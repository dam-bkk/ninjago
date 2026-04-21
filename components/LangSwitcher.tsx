'use client'

import { LANGS } from '@/lib/i18n'
import { useLang } from '@/lib/lang-context'

export default function LangSwitcher({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useLang()

  return (
    <div className="flex items-center gap-1">
      {LANGS.map(l => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition-all"
          style={lang === l.code
            ? dark
              ? { background: '#CCFF00', color: '#0A1628' }
              : { background: '#0A1628', color: '#CCFF00' }
            : dark
              ? { background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.50)' }
              : { background: 'rgba(10,22,40,0.08)', color: 'rgba(10,22,40,0.40)' }
          }
        >
          <span>{l.flag}</span>
          <span>{l.label}</span>
        </button>
      ))}
    </div>
  )
}
