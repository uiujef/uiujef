import type { Metadata } from 'next'
import { SiteFooter } from '@/components/site-footer'
import { SiteNav } from '@/components/site-nav'
import { org } from '@/lib/site-data'

export const metadata: Metadata = {
  title: `Privacy Policy — ${org.shortName}`,
  description: `Privacy Policy and data protection guidelines for ${org.shortName}.`,
}

export default function PrivacyPage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteNav />
      <main className="flex-1 bg-navy-deep text-white py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gold mb-8">Privacy Policy</h1>
          <div className="space-y-8 text-white/80 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p>
                At the UIU Junior Economists' Forum (UIUJEF), we are deeply committed to protecting the privacy and personal information of our members, event attendees, and website visitors. This policy outlines how we collect, use, and safeguard your data.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
              <p>
                When you register for a membership or an event, we collect essential information such as your Name, UIU Email, Student ID, Department, Phone Number, Blood Group, and Payment Transaction IDs.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Data Privacy & Protection</h2>
              <p>
                We prioritize your privacy. General members' sensitive details, including phone numbers, addresses, and student IDs, are kept strictly confidential and hidden from public view to ensure maximum privacy and security. Only authorized administrators have access to this information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Use of Information</h2>
              <p>
                The information collected is used exclusively for managing club memberships, processing event registrations, verifying student status, and communicating important updates related to UIUJEF activities.
              </p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
