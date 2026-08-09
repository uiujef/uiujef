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
  metadataBase: new URL('https://www.uiujef.org'),
  title: {
    default: "UIU Junior Economists' Forum (UIUJEF) — Together We Thrive, Together We Rise",
    template: "%s | UIUJEF",
  },
  description:
    'UIUJEF empowers a diverse community of future leaders, innovators, and strategic thinkers at United International University through research, debate, and national summits. 500+ members since 2016.',
  keywords: [
    'UIU',
    'UIUJEF',
    'Economics Club',
    'United International University',
    'UIU Junior Economists Forum',
    'Dhaka',
  ],
  authors: [{ name: 'UIUJEF', url: 'https://www.uiujef.org' }],
  openGraph: {
    title: 'UIUJEF - United International University Junior Economists Forum',
    description: 'The official platform of UIUJEF. Join us to explore economics, business, and leadership.',
    type: 'website',
    url: 'https://uiujef.org',
    siteName: 'UIUJEF',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'UIUJEF Preview Image',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: "UIU Junior Economists' Forum (UIUJEF)",
    description:
      'Empowering a diverse community of future leaders, innovators, and strategic thinkers at United International University.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  verification: {
    google: 'IFrhmeMCl72Qo9ZPBPUzK4lr2oU2FxJ3Ynpg_G8ApVE',
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
