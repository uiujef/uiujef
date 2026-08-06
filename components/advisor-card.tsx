'use client'

import Image from 'next/image'
import type { Member } from '@/data/members'
import { cn } from '@/lib/utils'

type AdvisorCardProps = {
  member: Member
  onClick?: () => void
  className?: string
}

export function AdvisorCard({ member, onClick, className }: AdvisorCardProps) {
  return (
    <article
      onClick={onClick}
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl',
        'border border-border bg-card transition-all duration-200',
        'hover:border-[#F26522]/40 hover:shadow-xl hover:shadow-[#F26522]/8',
        className,
      )}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#1B2A4A] via-[#F26522] to-[#1B2A4A] opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:gap-6">
        {/* Circular portrait */}
        <div className="relative mx-auto shrink-0 sm:mx-0">
          <div className="absolute inset-0 -m-1.5 rounded-full border-2 border-dashed border-[#F26522]/20 transition-transform duration-700 group-hover:rotate-180" />
          <div className="relative size-24 overflow-hidden rounded-full ring-3 ring-[#1B2A4A]/20 shadow-lg transition-all duration-300 group-hover:ring-[#F26522]/50 group-hover:scale-105 sm:size-28">
            {member.image_url ? (
              <Image
                src={member.image_url}
                alt={member.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 96px, 112px"
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center text-3xl font-bold text-muted-foreground">
                {member.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex min-w-0 flex-1 flex-col text-center sm:text-left">
          <h3 className="font-serif text-lg font-bold text-navy transition-colors group-hover:text-[#F26522] sm:text-xl">
            {member.name}
          </h3>
          <p className="mt-0.5 text-sm font-semibold text-[#F26522]/80">
            {member.role}
          </p>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {member.quote}
          </p>
        </div>
      </div>
    </article>
  )
}
