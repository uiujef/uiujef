import { Metadata } from 'next'
import { HeroSection } from '@/components/hero-section'
import { SiteNav } from '@/components/site-nav'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "UIU Junior Economists' Forum (UIUJEF) — Official Website",
  description: "Welcome to UIUJEF, the premier economics club at United International University (UIU). Join our flagship event EconThon and be part of a thriving community of future leaders.",
  openGraph: {
    title: "UIU Junior Economists' Forum (UIUJEF) — Official Website",
    description: "Welcome to UIUJEF, the premier economics club at United International University (UIU). Join our flagship event EconThon and be part of a thriving community of future leaders.",
    url: "https://www.uiujef.org",
    siteName: "UIUJEF",
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  }
}

export default function HomePage() {
  return (
    <div className="relative">
      <SiteNav />

      <main>
        <HeroSection />
      </main>
    </div>
  )
}
