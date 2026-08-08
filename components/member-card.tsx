'use client'

import Image from 'next/image'
import { FacebookIcon, InstagramIcon, LinkedinIcon } from '@/components/social-icons'
import type { Member } from '@/data/members'
import { cn } from '@/lib/utils'

type MemberCardProps = {
  member: Member
  onClick?: () => void
  className?: string
}

export function MemberCard({ member, onClick, className }: MemberCardProps) {
  const displayRole = member.custom_role && member.role === 'Other (Custom Role)' ? member.custom_role : member.role

  return (
    <article
      onClick={onClick}
      className={cn(
        'group relative flex cursor-pointer flex-col items-center pt-4 pb-2 px-2',
        'transition-all duration-300 ease-out hover:-translate-y-1',
        className,
      )}
    >
      {/* Circular profile image with animated border */}
      <div className="relative mb-4">
        {/* Spinning dashed ring on hover */}
        <div className="absolute inset-0 -m-1.5 rounded-full border-2 border-dashed border-[#F26522]/40 transition-transform duration-700 group-hover:rotate-180" />
        {/* Solid colored ring */}
        <div className="relative size-32 overflow-hidden rounded-full ring-4 ring-[#F26522] shadow-xl transition-transform duration-300 group-hover:scale-105 sm:size-40">
          {member.image_url ? (
            <Image
              src={member.image_url}
              alt={member.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 128px, 160px"
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center text-4xl font-bold text-muted-foreground">
              {member.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Name, designation, bio */}
      <div className="text-center w-full">
        <h3 className="font-serif text-lg font-bold text-navy transition-colors group-hover:text-[#F26522] sm:text-xl line-clamp-1 px-2" title={member.name}>
          {member.name}
        </h3>
        <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-[#F26522]/80 line-clamp-1 px-2" title={displayRole}>
          {displayRole}
        </p>

        {(member.role === 'Alumni' || member.role === 'Advisor') && (
          <div className="mt-1.5 text-xs text-muted-foreground line-clamp-2 px-2">
            {member.current_job && <p className="font-medium text-navy/80 truncate" title={member.current_job}>💼 {member.current_job}</p>}
            {member.past_role && <p className="truncate" title={`Was: ${member.past_role}`}>Was: {member.past_role}</p>}
          </div>
        )}

        <div className="mt-3 flex justify-center gap-4">
          {member.facebook_url && (
            <a href={member.facebook_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-blue-600 transition-colors">
              <FacebookIcon className="size-4" />
            </a>
          )}
          {member.instagram_url && (
            <a href={member.instagram_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-pink-600 transition-colors">
              <InstagramIcon className="size-4" />
            </a>
          )}
          {member.linkedin_url && (
            <a href={member.linkedin_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-blue-700 transition-colors">
              <LinkedinIcon className="size-4" />
            </a>
          )}
        </div>

        <p className="mt-3 line-clamp-2 max-w-[200px] mx-auto text-xs leading-relaxed text-muted-foreground">
          {member.quote}
        </p>
      </div>
    </article>
  )
}
