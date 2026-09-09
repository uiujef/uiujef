import { Metadata } from 'next'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import EventDetailsClient from '@/components/event-details-client'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const { data: event } = await supabase
    .from('events')
    .select('title, excerpt, image')
    .eq('id', resolvedParams.id)
    .single()

  if (!event) {
    return {
      title: 'Event Not Found — UIUJEF',
      description: 'The event you are looking for does not exist.',
    }
  }

  return {
    title: `${event.title} — UIUJEF`,
    description: event.excerpt || 'Join us for this exciting event hosted by UIUJEF.',
    openGraph: {
      title: event.title,
      description: event.excerpt || 'Join us for this exciting event hosted by UIUJEF.',
      images: event.image ? [{ url: event.image }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.excerpt || 'Join us for this exciting event hosted by UIUJEF.',
      images: event.image ? [event.image] : [],
    },
  }
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params

  return (
    <div className="relative bg-background min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1">
        <EventDetailsClient eventId={resolvedParams.id} />
      </main>
      <SiteFooter />
    </div>
  )
}
