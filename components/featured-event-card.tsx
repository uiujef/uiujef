'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CountdownTimer } from '@/components/countdown-timer'

export function FeaturedEventCard({ featuredEvent }: { featuredEvent: any }) {
  const [now, setNow] = useState(Date.now())
  
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!featuredEvent) return null

  const startTime = featuredEvent.registration_start_date ? new Date(featuredEvent.registration_start_date).getTime() : 0
  const deadlineTime = featuredEvent.registration_deadline ? new Date(featuredEvent.registration_deadline).getTime() : 0
  const hasStarted = !startTime || startTime <= now
  const isExpired = deadlineTime > 0 && deadlineTime <= now

  let targetTime = 0
  let countdownLabel = ""
  let showCountdown = false

  if (featuredEvent.is_registration_open) {
    if (!hasStarted) {
      targetTime = startTime
      countdownLabel = "Registration Starts In:"
      showCountdown = true
    } else if (hasStarted && !isExpired && deadlineTime > 0) {
      targetTime = deadlineTime
      countdownLabel = "Registration Ends In:"
      showCountdown = true
    }
  }

  return (
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
          {showCountdown && (
            <div className="mt-2 sm:mt-3">
              <p className="text-xs font-bold text-white/70 mb-1.5">{countdownLabel}</p>
              <CountdownTimer targetDate={new Date(targetTime).toISOString()} />
            </div>
          )}
        </div>
        
        {!hasStarted ? (
          <button 
            disabled
            className="shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white/50 cursor-not-allowed"
          >
            Opening Soon
          </button>
        ) : hasStarted && !isExpired ? (
          <Link 
            href={featuredEvent.is_registration_open ? `/events/${(featuredEvent.app_id_prefix || featuredEvent.id).toLowerCase()}/register` : `/events`}
            className="shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-[#F26522] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#F26522]/30 transition-all duration-200 hover:bg-[#FF7A3D] hover:shadow-[#F26522]/50"
          >
            {featuredEvent.is_registration_open ? 'Register Now' : 'View Event'}
            <ArrowRight className="size-3.5 transition-transform duration-150 hover:translate-x-0.5" />
          </Link>
        ) : (
          <button 
            disabled
            className="shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white/50 cursor-not-allowed"
          >
            Registration Closed
          </button>
        )}
      </div>
    </div>
  )
}
