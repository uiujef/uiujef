'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CalendarDays, ChevronRight, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function EventDetailsClient({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          extendedDetails: data.extendedDetails || data.extended_details,
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
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-white/60">{error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="relative w-full overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
        {event.image && (
          <div className="relative w-full shrink-0 bg-navy-deep/5 border-b border-slate-100 mb-6 flex justify-center items-center">
            <img
              src={event.image}
              alt={event.title}
              className="w-full max-h-[50vh] object-contain"
            />
          </div>
        )}
        <div className="flex flex-col p-6 sm:p-10 pt-0 sm:pt-0">
          <h2 className="font-serif text-4xl font-bold text-navy">{event.title}</h2>
          <div className="mt-4 mb-8 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/5 px-4 py-1.5 text-sm font-semibold text-navy/70">
              <CalendarDays className="size-4" />
              {event.dateLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 border border-gold/30 px-4 py-1.5 text-sm font-semibold text-gold-soft">
              {event.category}
            </span>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-navy/40">About the Event</h3>
              <div className="prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-navy prose-a:text-[#F26522] prose-img:rounded-xl">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {event.description}
                </ReactMarkdown>
              </div>
            </div>

            {event.extendedDetails && (
              <>
                {event.extendedDetails.speakers && event.extendedDetails.speakers.length > 0 && (
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy/40">
                      <span className="flex size-6 items-center justify-center rounded-full bg-navy/5 text-navy/60">🎤</span> 
                      Speakers
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {event.extendedDetails.speakers.map((speaker: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 rounded-2xl border border-border p-4">
                          <div className="size-12 shrink-0 overflow-hidden rounded-full bg-navy/5">
                            {speaker.image ? (
                              <img src={speaker.image} alt={speaker.name} className="size-full object-cover" />
                            ) : (
                              <div className="flex size-full items-center justify-center text-xl font-bold text-navy/20">
                                {speaker.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-navy">{speaker.name}</p>
                            <p className="text-sm text-slate-500">{speaker.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                  onClick={() => router.push(`/events?register=${event.id}`)}
                  className="group inline-flex items-center gap-2 rounded-full bg-[#F26522] px-8 py-4 text-base font-bold text-white shadow-[0_0_20px_rgba(242,101,34,0.4)] transition-all hover:bg-[#FF7A3D] hover:shadow-[0_0_30px_rgba(242,101,34,0.6)]"
                >
                  Register Now
                  <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
