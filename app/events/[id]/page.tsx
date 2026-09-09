import { Metadata } from 'next'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import EventDetailsClient from '@/components/event-details-client'

export const metadata: Metadata = {
  title: 'Event Details — UIUJEF',
  description: 'View event details and register',
}

export default function EventPage({ params }: { params: { id: string } }) {
  return (
    <div className="relative bg-background min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1">
        <EventDetailsClient eventId={params.id} />
      </main>
      <SiteFooter />
    </div>
  )
}
