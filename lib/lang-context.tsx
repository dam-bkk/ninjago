'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { type Lang, t } from './i18n'

export { t }
export type { Lang }

type LangCtx = {
  lang: Lang
  setLang: (l: Lang) => void
}

const LangContext = createContext<LangCtx>({ lang: 'en', setLang: () => {} })

export function LangProvider({ children, initialLang }: { children: React.ReactNode; initialLang?: string }) {
  const [lang, setLangState] = useState<Lang>(() => {
    // Use initialLang (from DB) if provided, else fall back to localStorage
    if (initialLang && ['en', 'th', 'fr'].includes(initialLang)) return initialLang as Lang
    return 'en'
  })

  useEffect(() => {
    // On mount: DB value (initialLang) wins over localStorage
    if (initialLang && ['en', 'th', 'fr'].includes(initialLang)) {
      setLangState(initialLang as Lang)
      localStorage.setItem('ninja_lang', initialLang)
    } else {
      const stored = localStorage.getItem('ninja_lang') as Lang | null
      if (stored && ['en', 'th', 'fr'].includes(stored)) setLangState(stored)
    }
  }, [initialLang])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('ninja_lang', l)
    // Fire-and-forget save to DB (only works when authenticated)
    fetch('/api/portal/lang', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: l }),
    }).catch(() => {}) // Ignore errors (e.g. on login page, not authenticated yet)
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
