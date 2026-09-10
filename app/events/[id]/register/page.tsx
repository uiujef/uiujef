import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { DynamicEventForm } from '@/components/dynamic-event-form'
import Link from 'next/link'
import Image from 'next/image'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedParams.id)
  
  let query = supabase.from('events').select('title')
  if (isUUID) {
    query = query.eq('id', resolvedParams.id)
  } else {
    query = query.ilike('app_id_prefix', resolvedParams.id)
  }
  
  const { data: event } = await query.single()

  if (!event) {
    return { title: 'Event Not Found — UIUJEF' }
  }

  return { title: `Register: ${event.title} — UIUJEF` }
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
  
  const { data, error } = await query.single()

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B1120] px-4 text-center">
        <h2 className="font-serif text-3xl font-bold text-white md:text-4xl mb-4">Event Not Found</h2>
        <Link href="/events" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/20 border border-white/5">
          Back to Events
        </Link>
      </div>
    )
  }

  const requiresReg = data.requires_registration ?? data.requiresRegistration
  const isOpen = data.is_registration_open ?? data.isRegistrationOpen

  if (!requiresReg) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B1120] px-4 text-center">
        <h2 className="font-serif text-3xl font-bold text-white md:text-4xl mb-4">Registration Not Required</h2>
        <Link href={`/events/${resolvedParams.id}`} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/20 border border-white/5">
          Back to Event
        </Link>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B1120] px-4 text-center">
        <h2 className="font-serif text-3xl font-bold text-white md:text-4xl mb-4">Registration Closed</h2>
        <Link href={`/events/${resolvedParams.id}`} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/20 border border-white/5">
          Back to Event
        </Link>
      </div>
    )
  }

  const mappedConfig = {
    isTeamBased: data.participation_type === 'Team' || data.is_team_based || data.isTeamBased,
    maxTeamMembers: data.max_team_size ?? data.max_team_members ?? data.maxTeamMembers,
    requireTeamName: data.require_team_name ?? data.requireTeamName ?? true,
    requireTeamIcon: data.require_team_icon ?? data.requireTeamIcon ?? false,
    requireUniversityID: data.require_university_id ?? data.requireUniversityID ?? true,
    requiresPayment: data.requires_payment ?? data.requiresPayment,
    eventLevel: data.event_level,
    is_members_only: data.is_members_only,
    custom_form_fields: data.custom_form_fields,
    is_custom_form: data.is_custom_form,
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col">
      <div className="w-full max-w-4xl mx-auto py-8 px-4 flex justify-center shrink-0">
        <Link href="/" className="inline-block transition-transform hover:scale-105">
          <Image src="/logo.png" alt="UIUJEF Logo" width={160} height={44} className="h-10 w-auto object-contain" />
        </Link>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 pb-20">
        <div className="bg-white/5 rounded-3xl p-6 md:p-10 border border-white/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F26522] to-gold"></div>
          
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2">{data.title}</h1>
              <p className="text-white/60">Complete your registration below</p>
            </div>
            <Link href={`/events/${resolvedParams.id}`} className="text-sm font-semibold text-white/60 hover:text-white transition-colors px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5">
              Cancel
            </Link>
          </div>

          <DynamicEventForm
            eventId={data.id}
            eventName={data.title}
            eventDescription={data.description}
            appIdPrefix={data.app_id_prefix || 'EVENT'}
            config={mappedConfig}
            registrationFee={data.registration_fee}
            onSuccess={() => {}}
          />
        </div>
      </div>
    </div>
  )
}
