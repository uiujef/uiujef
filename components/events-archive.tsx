'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, Filter, ChevronRight } from 'lucide-react'
import { type Event } from '@/types'
import { DynamicEventForm } from '@/components/dynamic-event-form'
import { CountdownTimer } from '@/components/countdown-timer'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { MediaBackground } from '@/components/media-background'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ─── Category filter ──────────────────────────────────────────────────────────

type Category = Event['category'] | 'All'

const categories: Category[] = [
  'All',
  'Competition',
  'Summit',
  'Workshop',
  'Seminar',
  'Social',
  'Other',
]

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({
  event,
  onRegister,
  onLearnMore,
}: {
  event: Event
  onRegister: (event: Event) => void
  onLearnMore: (event: Event) => void
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-[#F26522]/10 hover:border-[#F26522]/30">
      {/* Cover */}
      <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
        <Image
          src={event.image || '/placeholder.svg'}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <span className="absolute left-3 top-3 rounded-full bg-navy-deep/80 px-3 py-1 text-xs font-medium text-gold backdrop-blur-sm">
          {event.category}
        </span>
        {event.requiresRegistration && event.isRegistrationOpen && (
          <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-[#F26522] px-3 py-1 text-xs font-bold text-white shadow">
            <span className="size-1.5 animate-ping rounded-full bg-white opacity-75" />
            Registration Open
          </span>
        )}
        {event.isPinned && (
          <span className="absolute left-3 bottom-3 flex items-center gap-1.5 rounded-full bg-yellow-500/90 px-3 py-1 text-xs font-bold text-white shadow backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
            Pinned
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {event.dateLabel}
        </p>
        <h3 className="mt-2 font-serif text-xl font-bold leading-snug text-navy group-hover:text-[#F26522] transition-colors">
          {event.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {event.description?.replace(/[#*_`>\n\[\]]/g, ' ')}
        </p>

        {/* Registration deadline */}
        {event.requiresRegistration && event.isRegistrationOpen && event.registrationDeadline && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#F26522]/5 px-3 py-2 border border-[#F26522]/10">
            <p className="text-xs font-semibold text-[#F26522]">
              Ends in:
            </p>
            <CountdownTimer targetDate={event.registrationDeadline} compact />
          </div>
        )}

        {/* CTA */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {event.requiresRegistration && (
            event.isRegistrationOpen ? (
              <button
                onClick={() => onRegister(event)}
                className="group/btn inline-flex items-center gap-2 rounded-full bg-[#F26522] px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-[#F26522]/20 transition-all duration-200 hover:bg-[#FF7A3D] hover:shadow-[#F26522]/40"
              >
                Register Now
                <ChevronRight className="size-4 transition-transform duration-150 group-hover/btn:translate-x-0.5" />
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-2.5 text-sm font-medium text-muted-foreground">
                Registration Closed
              </span>
            )
          )}
          
          <button
            onClick={() => onLearnMore(event)}
            className="inline-flex items-center gap-2 rounded-full border border-navy/20 bg-transparent px-5 py-2.5 text-sm font-bold text-navy transition-all hover:bg-navy/5"
          >
            Read More
          </button>
        </div>
      </div>
    </article>
  )
}

// ─── Events Archive Page ──────────────────────────────────────────────────────

export default function EventsArchive() {
  const [activeCategory, setActiveCategory] = useState<Category>('All')
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [bgMedia, setBgMedia] = useState<string | null>(null)
  const [registerEvent, setRegisterEvent] = useState<Event | null>(null)
  const [detailsEvent, setDetailsEvent] = useState<Event | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true)
      setFetchError(null)
      try {
        const { data: settingsData } = await supabase.from('site_settings').select('bg_events').limit(1).maybeSingle()
        if (settingsData && settingsData.bg_events) {
          setBgMedia(settingsData.bg_events)
        }

        const { data, error } = await supabase.from('events').select('*').order('date', { ascending: false })
        if (error) throw error
        if (data) {
          const mappedEvents: Event[] = data.map(d => ({
            id: d.id,
            title: d.title,
            date: d.date,
            dateLabel: d.dateLabel || new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(d.date)),
            description: d.description,
            image: d.image,
            category: d.category,
            excerpt: d.excerpt,
            isRegistrationOpen: d.is_registration_open ?? d.isRegistrationOpen,
            requiresRegistration: d.requires_registration ?? d.requiresRegistration,
            registrationDeadline: d.registration_deadline ?? d.registrationDeadline,
            registration: d.requires_registration ?? d.requiresRegistration ? {
              isTeamBased: d.participation_type === 'Team' || d.is_team_based || d.isTeamBased,
              maxTeamMembers: d.max_team_size ?? d.max_team_members ?? d.maxTeamMembers,
              requireTeamName: d.require_team_name ?? d.requireTeamName ?? true, // Require by default if team
              requireTeamIcon: d.require_team_icon ?? d.requireTeamIcon ?? false,
              requireUniversityID: d.require_university_id ?? d.requireUniversityID ?? true,
              requiresPayment: d.requires_payment ?? d.requiresPayment,
              eventLevel: d.event_level,
            } : undefined,
            registrationFee: d.registration_fee,
            extendedDetails: d.extendedDetails || d.extended_details,
            isPinned: d.is_pinned,
            pinnedAt: d.pinned_at,
          }))
          setEvents(mappedEvents)
        }
      } catch (err: any) {
        console.error('Error fetching events:', err)
        setFetchError('Failed to load events: ' + err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [])

  useEffect(() => {
    const registerId = searchParams.get('register')
    if (registerId && events.length > 0) {
      const eventToRegister = events.find((e) => e.id === registerId)
      if (eventToRegister && eventToRegister.isRegistrationOpen) {
        setRegisterEvent(eventToRegister)
      }
    }
  }, [searchParams, events])

  const filtered =
    activeCategory === 'All'
      ? events
      : events.filter((e) => e.category === activeCategory)

  const sorted = [...filtered].sort((a, b) => {
    // Sort by pinned first
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    
    if (a.isPinned && b.isPinned) {
      // Sort pinned by most recently pinned (pinnedAt desc)
      const dateA = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0
      const dateB = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0
      return dateB - dateA
    }
    
    // Sort unpinned by date descending
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const upcoming = sorted.filter((e) => new Date(e.date) >= new Date())
  const past = sorted.filter((e) => new Date(e.date) < new Date())

  return (
    <section className="bg-background">
      {/* ── Hero header ── */}
      <div className="relative overflow-hidden border-b border-border bg-navy-deep min-h-[300px] flex items-center">
        <MediaBackground url={bgMedia} overlayClassName="bg-navy-deep/70" />
        <div className="relative mx-auto max-w-6xl w-full px-5 py-16 sm:px-6 lg:px-8 lg:py-20 z-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium tracking-wide text-gold-soft">
              <CalendarDays className="size-3.5" />
              Events Portal
            </span>
            <h1 className="mt-5 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Events &amp; <span className="text-gold">Archive</span>
            </h1>
            <div className="mt-4 h-1.5 w-24 rounded-full bg-[#F26522]" />
            <p className="mt-6 text-base leading-relaxed text-white/70 sm:text-lg">
              Browse all UIUJEF events — from flagship summits and competitions to
              hands-on workshops and career seminars.
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">

        {/* Category filter bar */}
        <div className="mb-10 flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Filter className="size-3.5" />
            Filter
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              disabled={isLoading}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150',
                activeCategory === cat
                  ? 'bg-[#F26522] text-white shadow-sm shadow-[#F26522]/30'
                  : 'border border-border bg-card text-muted-foreground hover:border-[#F26522]/30 hover:text-navy',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-24 text-center">
            <p className="text-lg font-semibold text-navy animate-pulse">Loading events...</p>
          </div>
        ) : fetchError ? (
          <div className="py-24 text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-red-500/10 mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-lg font-bold text-red-500">{fetchError}</p>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">We encountered an issue while connecting to our database. Our team has been notified.</p>
          </div>
        ) : (
          <>
        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="mb-16">
            <div className="mb-8 flex items-center gap-4">
              <h2 className="font-serif text-2xl font-bold text-navy">Upcoming Events</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
              <span className="rounded-full bg-[#F26522]/10 px-3 py-1 text-xs font-bold text-[#F26522]">
                {upcoming.length}
              </span>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} onRegister={setRegisterEvent} onLearnMore={setDetailsEvent} />
              ))}
            </div>
          </div>
        )}

        {/* Past events */}
        {past.length > 0 && (
          <div>
            <div className="mb-8 flex items-center gap-4">
              <h2 className="font-serif text-2xl font-bold text-navy">Past Events</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground">
                {past.length}
              </span>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event) => (
                <EventCard key={event.id} event={event} onRegister={setRegisterEvent} onLearnMore={setDetailsEvent} />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-lg font-semibold text-navy">No events in this category yet.</p>
            <button
              onClick={() => setActiveCategory('All')}
              className="mt-4 text-sm font-semibold text-[#F26522] hover:underline"
            >
              Show all events
            </button>
          </div>
        )}
        </>
        )}

        {/* Back to home */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-navy"
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* ── Registration modal ── */}
      {registerEvent && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Register for ${registerEvent.title}`}
        >
          <div
            className="absolute inset-0 bg-navy-deep/70 backdrop-blur-sm"
            onClick={() => setRegisterEvent(null)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain rounded-3xl bg-navy-deep shadow-2xl">
            <button
              onClick={() => setRegisterEvent(null)}
              className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Close registration form"
            >
              ✕
            </button>
            <div className="p-6 pb-0 sm:p-8 sm:pb-0">
              <h2 className="font-serif text-2xl font-bold text-white">{registerEvent.title}</h2>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-white/50">{registerEvent.dateLabel}</p>
                {registerEvent.isRegistrationOpen && registerEvent.registrationDeadline && (
                  <div className="flex items-center gap-2 rounded-full bg-[#F26522]/10 border border-[#F26522]/20 px-3 py-1.5">
                    <span className="text-xs font-semibold text-[#F26522]">Closes in:</span>
                    <div className="text-xs text-[#F26522]">
                      <CountdownTimer targetDate={registerEvent.registrationDeadline} compact />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 sm:p-8">
              {registerEvent.registration ? (
                <DynamicEventForm
                  eventId={registerEvent.id}
                  eventName={registerEvent.title}
                  config={registerEvent.registration}
                  registrationFee={(registerEvent as any).registrationFee}
                  onSuccess={() => setRegisterEvent(null)}
                />
              ) : (
                <p className="text-white/60">Registration details coming soon.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Event Details Modal ── */}
      {detailsEvent && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Details for ${detailsEvent.title}`}
        >
          <div
            className="absolute inset-0 bg-navy-deep/80 backdrop-blur-sm"
            onClick={() => setDetailsEvent(null)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Sticky Close Button in Fixed Container */}
            <button
              onClick={() => setDetailsEvent(null)}
              className="absolute right-4 top-4 z-20 flex size-9 items-center justify-center rounded-full bg-black/5 text-navy/60 transition-colors hover:bg-black/10 hover:text-navy"
              aria-label="Close details"
            >
              ✕
            </button>
            
            {/* Scrollable Content */}
            <div className="overflow-y-auto overscroll-contain flex flex-col p-6 sm:p-8">
              <h2 className="font-serif text-3xl font-bold text-navy pr-10">{detailsEvent.title}</h2>
              <div className="mt-2 mb-8 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/5 px-3 py-1 text-xs font-semibold text-navy/70">
                  <CalendarDays className="size-3.5" />
                  {detailsEvent.dateLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 border border-gold/30 px-3 py-1 text-xs font-semibold text-gold-soft">
                  {detailsEvent.category}
                </span>
              </div>

              <div className="space-y-8">
                {/* Description */}
                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-navy/40">About the Event</h3>
                  <div className="prose prose-sm md:prose-base prose-slate max-w-none w-full dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {detailsEvent.description ? detailsEvent.description.replace(/\\n/g, '\n') : ""}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Extended Details */}
                {detailsEvent.extendedDetails && (
                  <>
                    {detailsEvent.extendedDetails.rules && detailsEvent.extendedDetails.rules.length > 0 && (
                      <div className="rounded-2xl border border-navy/10 bg-navy/4 p-5">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy">
                          <span className="flex size-6 items-center justify-center rounded-full bg-navy/10 text-navy">📋</span> 
                          Rules & Guidelines
                        </h3>
                        <ul className="space-y-2 text-sm text-navy/70">
                          {detailsEvent.extendedDetails.rules.map((rule, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-[#F26522]">•</span>
                              {rule}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {detailsEvent.extendedDetails.teamRequirements && detailsEvent.extendedDetails.teamRequirements.length > 0 && (
                      <div className="rounded-2xl border border-[#F26522]/20 bg-[#F26522]/5 p-5">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#F26522]">
                          <span className="flex size-6 items-center justify-center rounded-full bg-[#F26522]/20 text-[#F26522]">👥</span> 
                          Team Requirements
                        </h3>
                        <ul className="space-y-2 text-sm text-[#F26522]/90">
                          {detailsEvent.extendedDetails.teamRequirements.map((req, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="font-bold">•</span>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {detailsEvent.extendedDetails.notices && detailsEvent.extendedDetails.notices.length > 0 && (
                      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-red-600">
                          <span className="flex size-6 items-center justify-center rounded-full bg-red-500/10 text-red-600">⚠️</span> 
                          Important Notices
                        </h3>
                        <ul className="space-y-2 text-sm text-red-600/90">
                          {detailsEvent.extendedDetails.notices.map((notice, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="font-bold">•</span>
                              {notice}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {detailsEvent.extendedDetails?.registeredTeams && detailsEvent.extendedDetails.registeredTeams.length > 0 && (
                  <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy">
                      <span className="flex size-6 items-center justify-center rounded-full bg-navy/10 text-navy">🏆</span> 
                      Registered Teams
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {detailsEvent.extendedDetails.registeredTeams.map((team, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3">
                          <span className="font-semibold text-sm text-navy">{team.name}</span>
                          <span className={cn(
                            "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                            team.status === 'approved' ? "bg-green-100 text-green-700" :
                            team.status === 'pending' ? "bg-orange-100 text-orange-700" :
                            "bg-red-100 text-red-700"
                          )}>
                            {team.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {detailsEvent.requiresRegistration && detailsEvent.isRegistrationOpen && (
                <div className="mt-10 pt-6 border-t border-border flex justify-end">
                  <button
                    onClick={() => {
                      setDetailsEvent(null)
                      setRegisterEvent(detailsEvent)
                    }}
                    className="group inline-flex items-center gap-2 rounded-full bg-[#F26522] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#F26522]/30 transition-all hover:bg-[#FF7A3D]"
                  >
                    Register Now
                    <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
