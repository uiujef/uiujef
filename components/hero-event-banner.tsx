'use client'

import Link from 'next/link'
import { CalendarDays, Clock, ArrowRight, Zap } from 'lucide-react'

interface HeroEventBannerProps {
  registrationActive: boolean
  eventName: string
  deadline?: string // ISO date string e.g. "2026-09-10"
  registerHref?: string
}

function useCountdown(deadline?: string): string {
  if (!deadline) return ''
  const now = new Date()
  const end = new Date(deadline)
  const diff = end.getTime() - now.getTime()
  if (diff <= 0) return 'Registration closed'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days > 1) return `${days} days left`
  if (days === 1) return '1 day left'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  return `${hours} hours left`
}

export function HeroEventBanner({
  registrationActive,
  eventName,
  deadline,
  registerHref = '/events',
}: HeroEventBannerProps) {
  const countdown = useCountdown(deadline)

  if (!registrationActive) return null

  return (
    <div
      role="banner"
      aria-label={`Registration open: ${eventName}`}
      className="relative overflow-hidden border-b border-[#F26522]/20 bg-gradient-to-r from-[#1B2A4A] via-[#1B2A4A] to-[#F26522]/20"
    >
      {/* Subtle animated shimmer — pure CSS, no JS */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(242,101,34,0.08)_50%,transparent_70%)] bg-[size:200%_100%] animate-[shimmer_3s_linear_infinite]"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-3 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        {/* Left: event info */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-start">
          {/* Live pulse dot */}
          <span className="flex items-center gap-1.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F26522] opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-[#F26522]" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#F26522]">
              Registration Open
            </span>
          </span>

          <span className="hidden text-white/20 sm:inline">|</span>

          <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <Zap className="size-3.5 text-[#F26522]" />
            {eventName}
          </span>

          {deadline && (
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/60">
              <Clock className="size-3" />
              {countdown}
            </span>
          )}

          {deadline && (
            <span className="flex items-center gap-1.5 text-xs text-white/40">
              <CalendarDays className="size-3" />
              Deadline:{' '}
              {new Date(deadline).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}
        </div>

        {/* Right: CTA */}
        <div className="flex items-center gap-2">
          <Link
            href="/events"
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-bold text-white transition-all duration-200 hover:bg-white/10"
          >
            View Event
          </Link>
          <Link
            href={registerHref}
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#F26522] px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-[#F26522]/30 transition-all duration-200 hover:bg-[#FF7A3D] hover:shadow-[#F26522]/50"
          >
            Register Now
            <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
