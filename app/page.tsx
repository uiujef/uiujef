import { HeroSection } from '@/components/hero-section'
import { SiteNav } from '@/components/site-nav'

export const dynamic = 'force-dynamic'
export const revalidate = 0
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
