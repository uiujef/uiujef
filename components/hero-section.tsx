import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { heroMedia, org, quickStats } from '@/lib/site-data'
import { CountdownTimer } from '@/components/countdown-timer'
import { supabase } from '@/lib/supabase'
import { MediaBackground } from '@/components/media-background'

export async function HeroSection() {
  const { data: featuredEvent } = await supabase
    .from('events')
    .select('*')
    .eq('is_featured', true)
    .single()

  const { data: settings } = await supabase
    .from('site_settings')
    .select('bg_home')
    .limit(1)
    .maybeSingle()

  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-navy-deep"
    >
      {/* Background media */}
      <MediaBackground url={settings?.bg_home || heroMedia.videoSrc} />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-20 pt-28 sm:px-6 lg:px-8 lg:pb-28 lg:pt-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* Left: copy */}
          <div className="">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium tracking-wide text-gold-soft">
              <span className="size-1.5 rounded-full bg-gold" />
              {org.university}
            </span>

            <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.1] tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
              Together We <span className="text-gold">Thrive</span>,
              <br className="hidden sm:block" /> Together We{' '}
              <span className="text-gold">Rise</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 text-pretty sm:text-lg">
              {org.subtext}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={org.ctaHref}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 text-sm font-semibold text-white shadow-lg shadow-gold/20 transition-all duration-200 hover:bg-gold-soft hover:shadow-xl hover:shadow-gold/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                {org.ctaLabel}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/about"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 px-7 text-sm font-medium text-white/90 transition-colors duration-200 hover:border-white/40 hover:bg-white/5"
              >
                Learn more
              </Link>
            </div>
          </div>

          {/* Right: glassmorphism stats card */}
          <div className="flex flex-col gap-6">
            
            {featuredEvent && (
              <div className="relative overflow-hidden rounded-2xl border border-[#F26522]/30 bg-[#F26522]/10 p-4 shadow-[0_0_20px_rgba(242,101,34,0.15)] backdrop-blur-xl transition-all duration-300 hover:border-[#F26522]/50 hover:shadow-[0_0_30px_rgba(242,101,34,0.25)]">
                <div className="absolute -left-4 -top-4 size-20 rounded-full bg-[#F26522]/20 blur-2xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="relative flex size-2 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F26522] opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-[#F26522]" />
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        Upcoming Event: {featuredEvent.title}
                      </h3>
                    </div>
                    {featuredEvent.registration_deadline ? (
                      <div className="mt-2 sm:mt-3">
                        <CountdownTimer targetDate={featuredEvent.registration_deadline} />
                      </div>
                    ) : featuredEvent.date && (
                      <div className="mt-2 sm:mt-3">
                        <CountdownTimer targetDate={featuredEvent.date} />
                      </div>
                    )}
                  </div>
                  {featuredEvent.registration_deadline && new Date(featuredEvent.registration_deadline) < new Date() ? (
                    <button 
                      disabled
                      className="shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white/50 cursor-not-allowed"
                    >
                      Registration Closed
                    </button>
                  ) : (
                    <Link 
                      href={featuredEvent.is_registration_open ? `/events?register=${featuredEvent.id}` : `/events`}
                      className="shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-[#F26522] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#F26522]/30 transition-all duration-200 hover:bg-[#FF7A3D] hover:shadow-[#F26522]/50"
                    >
                      {featuredEvent.is_registration_open ? 'Register Now' : 'View Event'}
                      <ArrowRight className="size-3.5 transition-transform duration-150 hover:translate-x-0.5" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-navy-deep/50 backdrop-blur-xl sm:p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-gold">
                  Quick Statistics
                </h2>
                <span className="text-xs text-white/50">{org.shortName}</span>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10">
                {quickStats.map((stat) => (
                  <div key={stat.id} className="bg-navy/40 p-4 sm:p-5">
                    <dd className="font-serif text-2xl font-bold text-white sm:text-3xl">
                      {stat.value}
                    </dd>
                    <dt className="mt-1 text-xs leading-relaxed text-white/60 sm:text-sm">
                      {stat.label}
                    </dt>
                  </div>
                ))}
              </dl>

              <p className="mt-6 text-xs leading-relaxed text-white/50">
                Active since 2016 — a student-run forum for research, debate, and policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
