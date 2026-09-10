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
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedParams.id)
  
  let query = supabase.from('events').select('title, excerpt, image')
  if (isUUID) {
    query = query.eq('id', resolvedParams.id)
  } else {
    query = query.ilike('app_id_prefix', resolvedParams.id)
  }
  
  const { data: event } = await query.maybeSingle()
  const fallbackName = isUUID ? 'Event' : resolvedParams.id.toUpperCase();

  const title = event?.title ? `${event.title} — UIUJEF` : `${fallbackName} — UIUJEF`;
  const description = event?.excerpt || 'Join us for this exciting event hosted by UIUJEF.';

  return {
    title,
    description,
    openGraph: {
      title: event?.title || fallbackName,
      description,
      images: event?.image ? [{ url: event.image }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: event?.title || fallbackName,
      description,
      images: event?.image ? [event.image] : [],
    },
  }
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params

  return (
    <div className="relative bg-[#0B1120] min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1">
        <EventDetailsClient eventId={resolvedParams.id} />
      </main>
      <SiteFooter />
    </div>
  )
}
