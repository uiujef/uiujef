import { notFound } from 'next/navigation'
import Link from 'next/link'
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

  const startTime = event.registration_start_date ? new Date(event.registration_start_date).getTime() : 0;
  const now = Date.now();

  if (startTime > 0 && startTime > now) {
    return (
      <div className="relative bg-[#0B1120] min-h-screen flex flex-col">
        <SiteNav/>
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 mt-16 sm:mt-20">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">Registration Not Open Yet</h1>
            <p className="text-white/60 mb-8">This event's registration will open on {new Date(event.registration_start_date).toLocaleString()}.</p>
            <Link href={`/events/${resolvedParams.id}`} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/20 border border-white/5">
              Back to Event Details
            </Link>
          </div>
        </main>
        <SiteFooter/>
      </div>
    )
  }

  const deadlineTime = event.registration_deadline ? new Date(event.registration_deadline).getTime() : 0;
  const isExpired = deadlineTime > 0 && deadlineTime <= now;

  if (isExpired || event.is_registration_open === false) {
    return (
      <div className="relative bg-[#0B1120] min-h-screen flex flex-col">
        <SiteNav/>
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 mt-16 sm:mt-20">
          <div className="text-center bg-white/5 border border-white/10 p-8 sm:p-12 rounded-3xl max-w-lg w-full backdrop-blur-sm">
            <div className="size-16 mx-auto bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h1 className="text-3xl font-serif font-bold text-white mb-4">Registration Closed</h1>
            <p className="text-white/60 mb-8 leading-relaxed">
              The deadline for this event has passed or registration has been closed. Thank you for your interest.
            </p>
            <Link href={`/events/${resolvedParams.id}`} className="inline-flex items-center gap-2 rounded-full bg-[#F26522] px-8 py-3.5 text-sm font-bold text-white shadow-sm shadow-[#F26522]/30 transition-all duration-200 hover:bg-[#FF7A3D] hover:shadow-[#F26522]/50">
              Return to Event Details
            </Link>
          </div>
        </main>
        <SiteFooter/>
      </div>
    )
  }

  // Explicitly map raw DB row to the EventRegistrationConfig
  const formConfig = {
    isTeamBased: event.participation_type?.startsWith('Team') || event.is_team_based || event.isTeamBased,
    participationType: event.participation_type || 'Individual',
    minTeamMembers: event.min_team_size || 1,
    maxTeamMembers: event.max_team_size || event.max_team_members || 1,
    requireTeamName: event.require_team_name ?? true,
    requireTeamIcon: event.require_team_icon ?? false,
    requireUniversityID: event.require_university_id ?? true,
    requiresPayment: event.requires_payment ?? false,
    eventLevel: event.event_level || 'On Campus',
    is_members_only: event.is_members_only ?? false,
    custom_form_fields: event.custom_form_fields || [],
    is_custom_form: event.is_custom_form ?? false,
    allowMultipleRegistrations: event.allow_multiple_registrations ?? false,
    registrationDeadline: event.registration_deadline,
  }

  return (
    <div className="relative bg-[#0B1120] min-h-screen flex flex-col">
      <SiteNav/>
      <main className="flex-1 flex justify-center p-4 sm:p-6 lg:p-8 mt-16 sm:mt-20">
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
