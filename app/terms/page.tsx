import type { Metadata } from 'next'
import { SiteFooter } from '@/components/site-footer'
import { SiteNav } from '@/components/site-nav'
import { org } from '@/lib/site-data'

export const metadata: Metadata = {
  title: `Terms & Conditions — ${org.shortName}`,
  description: `Terms and Conditions for joining and participating in ${org.shortName}.`,
}

export default function TermsPage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteNav />
      <main className="flex-1 bg-navy-deep text-white py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gold mb-8">Terms & Conditions</h1>
          <div className="space-y-8 text-white/80 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By registering for UIUJEF memberships or events, you agree to abide by the policies and regulations set forth by both the club and United International University.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Registration & Accuracy</h2>
              <p>
                Users must provide accurate, current, and complete student and contact information during registration. Misrepresentation of identity or university status may result in membership termination.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Payments & Refunds</h2>
              <p>
                Membership and event fees must be paid through our official payment channels (bKash, Nagad, Rocket, Bank) with valid Transaction IDs submitted. All fees are non-refundable unless explicitly specified otherwise for a particular event.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Code of Conduct</h2>
              <p>
                Members are expected to maintain professional and respectful behavior during all forum activities, online discussions, and university events. Harassment or disruptive behavior will not be tolerated.
              </p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
