import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { DynamicEventForm } from '@/components/dynamic-event-form'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import type { Metadata } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedParams.id)
  
  let query = supabase.from('events').select('title, excerpt')
  if (isUUID) {
    query = query.eq('id', resolvedParams.id)
  } else {
    query = query.ilike('app_id_prefix', resolvedParams.id)
  }
  
  const { data: event } = await query.maybeSingle()
  const fallbackName = isUUID ? 'Event' : resolvedParams.id.toUpperCase();

  return { title: event?.title ? `Register: ${event.title} — UIUJEF` : `Register: ${fallbackName} — UIUJEF` }
}

export default async function RegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedParams.id)
  
  let query = supabase.from('events').select('*')
  if (isUUID) {
    query = query.eq('id', resolvedParams.id)
  } else {
    query = query.ilike('app_id_prefix', resolvedParams.id)
  }
  
  const { data: event, error } = await query.maybeSingle()

  if (error || !event) {
    notFound()
  }

  // Explicitly map raw DB row to the EventRegistrationConfig
  const formConfig = {
    isTeamBased: event.participation_type === 'Team' || event.is_team_based === true,
    maxTeamMembers: event.max_team_size || event.max_team_members || 1,
    requireTeamName: event.require_team_name ?? true,
    requireTeamIcon: event.require_team_icon ?? false,
    requireUniversityID: event.require_university_id ?? true,
    requiresPayment: event.requires_payment ?? false,
    eventLevel: event.event_level || 'On Campus',
    is_members_only: event.is_members_only ?? false,
    custom_form_fields: event.custom_form_fields || [],
    is_custom_form: event.is_custom_form ?? false,
  }

  return (
    <div className="relative bg-[#0B1120] min-h-screen flex flex-col">
      <SiteNav/>
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 mt-16 sm:mt-20">
        <div className="w-full max-w-3xl">
          <div className="mb-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-2">Event Registration</h1>
            <p className="text-white/60">Fill out the form below to secure your spot.</p>
          </div>
          <DynamicEventForm eventId={event.id} eventName={event.title} appIdPrefix={event.app_id_prefix || 'EVENT'} config={formConfig} registrationFee={event.registration_fee} />
        </div>
      </main>
      <SiteFooter/>
    </div>
  )
}
