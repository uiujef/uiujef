import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Manrope, Playfair_Display } from 'next/font/google'
import { CreditFooter } from '@/components/credit-footer'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: "UIU Junior Economists' Forum (UIUJEF) — Together We Thrive, Together We Rise",
  description:
    'UIUJEF empowers a diverse community of future leaders, innovators, and strategic thinkers at United International University through research, debate, and national summits. 500+ members since 2016.',
  generator: 'v0.app',
  keywords: [
    'UIUJEF',
    'UIU Junior Economists Forum',
    'United International University',
    'economics club',
    'Dhaka',
  ],
  openGraph: {
    title: "UIU Junior Economists' Forum (UIUJEF)",
    description:
      'Empowering a diverse community of future leaders, innovators, and strategic thinkers at United International University.',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0d1730',
}

import { Toaster } from 'sonner'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`bg-background ${manrope.variable} ${playfair.variable}`}>
      <body className="flex min-h-svh flex-col font-sans antialiased">
        <div className="flex flex-1 flex-col">{children}</div>
        <CreditFooter />
        <Toaster richColors position="top-right" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
