import type { Metadata } from 'next'
import { AboutSection } from '@/components/about-section'
import { JoinCtaBand } from '@/components/join-cta-band'
import { SiteFooter } from '@/components/site-footer'
import { SiteNav } from '@/components/site-nav'
import { org } from '@/lib/site-data'

export const metadata: Metadata = {
  title: `About — ${org.shortName}`,
  description: `Discover ${org.shortName}'s mission, vision, and core pillars — shaping the economic minds of tomorrow at ${org.university}.`,
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AboutPage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteNav />
      <main className="flex-1">
        <AboutSection />
        <JoinCtaBand />
      </main>
      <SiteFooter />
    </div>
  )
}
