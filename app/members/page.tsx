import type { Metadata } from 'next'
import { MembersSection } from '@/components/members-section'
import { SiteFooter } from '@/components/site-footer'
import { SiteNav } from '@/components/site-nav'
import { org } from '@/lib/site-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: `Members — ${org.shortName}`,
  description: `Meet the members and executive board of ${org.shortName}.`,
}

export default function MembersPage() {
  return (
    <div className="relative">
      <SiteNav />
      <main>
        <MembersSection />
      </main>
      <SiteFooter />
    </div>
  )
}
