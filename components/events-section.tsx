import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, CalendarDays, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SectionHeader } from '@/components/ui/section-header'

export async function EventsSection() {
  const { data: latestEvents } = await supabase.from('events').select('*').order('date', { ascending: false }).limit(3)
  return (
    <section id="events" className="bg-background">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">

        {/* Header row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader subtitle="What's happening" title="Latest Events" />
          <Link
            href="/events"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-navy transition-colors duration-200 hover:text-[#F26522]"
          >
            View All Events
            <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Event cards grid — 3 columns on lg */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(latestEvents || []).map((event) => (
            <article
              key={event.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/10"
            >
              {/* Cover image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                <Image
                  src={event.image || '/placeholder.svg'}
                  alt={event.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Category badge */}
                <span className="absolute left-3 top-3 rounded-full bg-navy-deep/80 px-3 py-1 text-xs font-medium text-gold backdrop-blur-sm">
                  {event.category}
                </span>
                {/* Registration open badge */}
                {event.is_registration_open && (
                  <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#F26522] px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
                    <span className="size-1.5 rounded-full bg-white" />
                    Open
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  {event.dateLabel || new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(event.date))}
                </p>
                <h3 className="mt-2 font-serif text-lg font-bold leading-snug text-navy text-pretty">
                  {event.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {event.excerpt}
                </p>
                <Link
                  href={`/events`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy transition-colors duration-200 hover:text-[#F26522] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F26522]"
                >
                  Learn More
                  <ArrowUpRight
                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                  <span className="sr-only"> about {event.title}</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/events"
            className="group inline-flex items-center gap-2 rounded-full border border-navy/20 bg-navy/5 px-7 py-3 text-sm font-semibold text-navy transition-all duration-200 hover:border-[#F26522]/30 hover:bg-[#F26522]/8 hover:text-[#F26522]"
          >
            Browse All Events &amp; Archive
            <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
