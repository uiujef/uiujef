'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CalendarDays, ChevronRight, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DynamicEventForm } from '@/components/dynamic-event-form'

export default function EventDetailsClient({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvent() {
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)
        let query = supabase.from('events').select('*')
        if (isUUID) {
          query = query.eq('id', eventId)
        } else {
          query = query.ilike('app_id_prefix', eventId)
        }
        
        const { data, error: fetchError } = await query.single()

        if (fetchError || !data) {
          setError('Event not found or failed to load.')
          return
        }

        const mappedEvent = {
          id: data.id,
          title: data.title,
          date: data.date,
          dateLabel: data.dateLabel || new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(data.date)),
          description: data.description,
          image: data.image,
          category: data.category,
          isRegistrationOpen: data.is_registration_open ?? data.isRegistrationOpen,
          requiresRegistration: data.requires_registration ?? data.requiresRegistration,
          extendedDetails: data.extendedDetails || data.extended_details,
          registrationFee: data.registration_fee,
          appIdPrefix: data.app_id_prefix || 'EVENT',
          registration: data.requires_registration ?? data.requiresRegistration ? {
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
          } : undefined,
        }
        setEvent(mappedEvent)
      } catch (err: any) {
        setError('Error loading event')
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [eventId])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#F26522]" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-white/5 border border-white/10 ring-4 ring-white/5">
          <span className="text-4xl">🗓️</span>
        </div>
        <h2 className="font-serif text-3xl font-bold text-white md:text-4xl mb-4">Event Not Found</h2>
        <p className="max-w-md text-white/60 mb-8 leading-relaxed">
          The event you are looking for does not exist or has been removed. It may have concluded or been archived by the organizers.
        </p>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/20 border border-white/5"
        >
          Back to Events
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="relative w-full overflow-hidden rounded-3xl bg-white/5 border border-white/10 shadow-2xl flex flex-col">
        {event.image && (
          <div className="relative w-full shrink-0 bg-black/20 border-b border-white/10 mb-6 flex justify-center items-center">
            <img
              src={event.image}
              alt={event.title}
              className="w-full max-h-[50vh] object-contain"
            />
          </div>
        )}
        <div className="flex flex-col p-6 sm:p-10 pt-0 sm:pt-0">
          <h2 className="font-serif text-4xl font-bold text-white">{event.title}</h2>
          <div className="mt-4 mb-8 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/70">
              <CalendarDays className="size-4" />
              {event.dateLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 border border-gold/30 px-4 py-1.5 text-sm font-semibold text-gold-soft">
              {event.category}
            </span>
            {event.requiresRegistration && event.isRegistrationOpen && (
              <button
                onClick={() => {
                  document.getElementById('registration-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#F26522] px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#FF7A3D]"
              >
                Register Now
                <ChevronRight className="size-4" />
              </button>
            )}
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/40">About the Event</h3>
              <div className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-white prose-a:text-[#F26522] prose-img:rounded-xl">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {event.description}
                </ReactMarkdown>
              </div>
            </div>

            {event.extendedDetails && (
              <>
                {event.extendedDetails.speakers && event.extendedDetails.speakers.length > 0 && (
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/40">
                      <span className="flex size-6 items-center justify-center rounded-full bg-white/10 text-white/60">🎤</span> 
                      Speakers
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {event.extendedDetails.speakers.map((speaker: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="size-12 shrink-0 overflow-hidden rounded-full bg-white/10">
                            {speaker.image ? (
                              <img src={speaker.image} alt={speaker.name} className="size-full object-cover" />
                            ) : (
                              <div className="flex size-full items-center justify-center text-xl font-bold text-white/20">
                                {speaker.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white">{speaker.name}</p>
                            <p className="text-sm text-white/60">{speaker.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {event.extendedDetails.rules && event.extendedDetails.rules.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                      <span className="flex size-6 items-center justify-center rounded-full bg-white/10 text-white">📜</span> 
                      Rules & Guidelines
                    </h3>
                    <ul className="space-y-2 text-sm text-white/80">
                      {event.extendedDetails.rules.map((rule: string, idx: number) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-white/40 mt-1">•</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {event.requiresRegistration && (
              <div id="registration-section" className="pt-8 border-t border-white/10 mt-10">
                {event.isRegistrationOpen ? (
                  <div className="bg-white/5 rounded-3xl p-6 md:p-10 border border-white/10 shadow-sm">
                    <h3 className="font-serif text-2xl font-bold text-white mb-6 text-center">Event Registration</h3>
                    <DynamicEventForm
                      eventId={event.id}
                      eventName={event.title}
                      eventDescription={event.description}
                      appIdPrefix={event.appIdPrefix}
                      config={event.registration}
                      registrationFee={event.registrationFee}
                      onSuccess={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    />
                  </div>
                ) : (
                  <div className="bg-white/10 text-white/60 rounded-full px-8 py-4 font-bold text-center">
                    Registration Closed
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
