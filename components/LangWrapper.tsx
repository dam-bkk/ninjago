'use client'

import { useLang } from '@/lib/lang-context'

export default function LangWrapper({ children }: { children: React.ReactNode }) {
  const { lang } = useLang()
  return (
    <div className={lang === 'th' ? 'lang-th' : undefined}>
      {children}
    </div>
  )
}
