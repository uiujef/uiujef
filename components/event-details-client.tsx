'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CalendarDays, ChevronRight, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DynamicEventForm } from '@/components/dynamic-event-form'
import { CountdownTimer } from '@/components/countdown-timer'

export default function EventDetailsClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRegisterForm, setShowRegisterForm] = useState(false)

  useEffect(() => {
    async function fetchEvent() {
      try {
        const { data, error: fetchError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single()

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
          registrationDeadline: data.registration_deadline ?? data.registrationDeadline,
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
          registrationFee: data.registration_fee,
          extendedDetails: data.extendedDetails || data.extended_details,
          appIdPrefix: data.app_id_prefix || 'EVENT',
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
      <div className="flex justify-center items-center py-32 h-[60vh]">
        <Loader2 className="animate-spin size-8 text-[#F26522]" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="py-32 h-[60vh] flex items-center justify-center text-navy font-medium text-lg">
        {error || 'Event not found'}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 lg:px-8">
      {event.image && (
        <div className="relative w-full bg-slate-50 rounded-3xl overflow-hidden shadow-lg border border-slate-100 mb-10 bg-navy-deep/5 aspect-video">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <h1 className="font-serif text-3xl md:text-5xl font-bold text-navy mb-6">{event.title}</h1>
      
      <div className="mb-10 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/5 px-4 py-1.5 text-sm font-semibold text-navy/70">
          <CalendarDays className="size-4" />
          {event.dateLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 border border-gold/30 px-4 py-1.5 text-sm font-semibold text-gold-soft">
          {event.category}
        </span>
      </div>

      <div className="space-y-10">
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-navy/40 border-b border-navy/10 pb-2">About the Event</h3>
          <div className="prose prose-slate max-w-none w-full text-slate-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {event.description ? event.description.replace(/\\n/g, '\n') : ""}
            </ReactMarkdown>
          </div>
        </div>

        {event.extendedDetails && (
          <>
            {event.extendedDetails.rules && event.extendedDetails.rules.length > 0 && (
              <div className="rounded-2xl border border-navy/10 bg-navy/4 p-6">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy">
                  <span className="flex size-6 items-center justify-center rounded-full bg-navy/10 text-navy">📜</span> 
                  Rules & Guidelines
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {event.extendedDetails.rules.map((rule: string, idx: number) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-navy/40 mt-1">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {event.requiresRegistration && event.isRegistrationOpen && (
          <div className="pt-8 border-t border-border flex justify-end">
            <button
              onClick={() => setShowRegisterForm(true)}
              className="group inline-flex items-center gap-2 rounded-full bg-[#F26522] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#F26522]/30 transition-all hover:bg-[#FF7A3D]"
            >
              Register Now
              <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </div>

      {showRegisterForm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowRegisterForm(false)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain rounded-3xl bg-[#0B1120] shadow-2xl border border-white/10">
            <button
              onClick={() => setShowRegisterForm(false)}
              className="absolute right-3 top-3 z-50 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-orange-50 hover:text-orange-500"
              aria-label="Close registration form"
            >
              ✕
            </button>
            <div className="p-6 pb-0 sm:p-8 sm:pb-0">
              <h2 className="font-serif text-2xl font-bold text-white">{event.title}</h2>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-white/50">{event.dateLabel}</p>
                {event.isRegistrationOpen && event.registrationDeadline && (
                  <div className="flex items-center gap-2 rounded-full bg-[#F26522]/10 border border-[#F26522]/20 px-3 py-1.5">
                    <span className="text-xs font-semibold text-[#F26522]">Closes in:</span>
                    <div className="text-xs text-[#F26522]">
                      <CountdownTimer targetDate={event.registrationDeadline} compact />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 sm:p-8">
              {event.registration ? (
                <DynamicEventForm
                  eventId={event.id}
                  eventName={event.title}
                  eventDescription={event.description}
                  config={event.registration}
                  registrationFee={event.registrationFee}
                  onSuccess={() => setShowRegisterForm(false)}
                />
              ) : (
                <p className="text-white/60">Registration details coming soon.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
