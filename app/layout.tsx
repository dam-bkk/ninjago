import type { Metadata, Viewport } from 'next'
import { Nunito, Fredoka } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-nunito',
})

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-fredoka',
})

export const metadata: Metadata = {
  title: 'Ninja Academy',
  description: 'Ninja Academy — Bangkok',
  manifest: '/manifest.json',
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
  openGraph: {
    title: 'Ninja Academy',
    description: 'Ninja Academy — Bangkok',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Ninja Academy' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ninja Academy',
    description: 'Ninja Academy — Bangkok',
    images: ['/og-image.jpg'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1E2235',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${fredoka.variable} h-full`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  )
}
