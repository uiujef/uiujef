'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { X, Mail, Phone, Hash, Droplet, ShieldCheck, Building2, Briefcase, Star } from 'lucide-react'
import { FacebookIcon, InstagramIcon, LinkedinIcon } from '@/components/social-icons'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import type { Member } from '@/types'

interface MemberModalProps {
  member: Member | null
  onClose: () => void
}

export function MemberModal({ member, onClose }: MemberModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (member) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [member])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!member) return null

  const isAdvisor = member.role === 'Advisor'
  const displayRole = member.custom_role && member.role === 'Other (Custom Role)' ? member.custom_role : member.role
  const isDeveloper = member.name === 'Shaikh Jubair'
  const shouldHide = member.role === 'General Member' && member.name !== 'Shaikh Jubair'
  const showSensitiveInfo = !shouldHide

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${member.name} profile`}
    >
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0 bg-[#1B2A4A]/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Close button (Fixed inside outer container) */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 z-[110] rounded-full bg-black/10 p-2 text-navy/80 backdrop-blur-sm transition-colors hover:bg-black/20 hover:text-navy"
        >
          <X className="size-5" />
        </button>

        {/* Scrollable content wrapper */}
        <div className="flex flex-col md:flex-row overflow-y-auto overscroll-contain w-full h-full">
          {/* Left — profile image */}
          <div className="relative h-64 w-full shrink-0 bg-secondary md:h-auto md:w-[38%]">
            {member.image_url ? (
              <Image
                src={member.image_url}
                alt={member.name}
                fill
                className="object-cover rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none"
                sizes="(max-width: 768px) 100vw, 38vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-muted-foreground rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none bg-secondary">
                {member.name.charAt(0)}
              </div>
            )}
            {/* Category badge over image */}
            <span className="absolute left-4 bottom-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-[#1B2A4A]/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              <ShieldCheck className="size-3" />
              {displayRole}
            </span>
            {/* Gradient overlay at bottom on mobile */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/20 to-transparent md:hidden" />
          </div>

          {/* Right — details */}
          <div className="flex flex-col p-6 sm:p-8 md:w-[62%]">
            {/* Name, designation, responsibility */}
            <div>
              {isDeveloper ? (
                <a
                  href="https://shaikhjubair.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-serif text-2xl font-bold text-navy hover:text-orange-500 cursor-pointer transition-colors sm:text-3xl"
                >
                  {member.name}
                </a>
              ) : (
                <h2 className="font-serif text-2xl font-bold text-navy sm:text-3xl">
                  {member.name}
                </h2>
              )}
              <p className="mt-1 text-base font-semibold text-[#F26522]">
                {displayRole}
              </p>
            </div>

            {/* Social Links */}
            {(member.facebook_url || member.instagram_url || member.linkedin_url) && (
              <div className="mt-3 flex gap-4">
                {member.facebook_url && (
                  <a href={member.facebook_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-blue-600 transition-colors">
                    <FacebookIcon className="size-5" />
                  </a>
                )}
                {member.instagram_url && (
                  <a href={member.instagram_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-pink-600 transition-colors">
                    <InstagramIcon className="size-5" />
                  </a>
                )}
                {member.linkedin_url && (
                  <a href={member.linkedin_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-blue-700 transition-colors">
                    <LinkedinIcon className="size-5" />
                  </a>
                )}
              </div>
            )}

            {/* About / Bio */}
            <div className="mt-5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-navy/40 mb-2">
                Personal Quote / Bio
              </h3>
              <MarkdownRenderer 
                content={member.quote || "No quote provided."}
                className={`text-sm leading-relaxed text-navy/70 ${isDeveloper ? 'italic' : ''}`}
              />
            </div>

            {/* Additional Alumni/Advisor info */}
            {(member.role === 'Alumni' || member.role === 'Advisor') && (member.current_job || member.past_role) && (
              <div className="mt-4 bg-secondary/50 rounded-xl p-4">
                {member.current_job && (
                  <div className="flex items-center gap-2 text-sm text-navy mb-1">
                    <Briefcase className="size-4 text-[#F26522]" />
                    <span className="font-semibold">Current:</span> {member.current_job}
                  </div>
                )}
                {member.past_role && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="size-4" />
                    <span>Past Role:</span> {member.past_role}
                  </div>
                )}
              </div>
            )}

            {/* Data points grid */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-navy/8 pt-5">
              {/* Student ID */}
              {showSensitiveInfo && (
                <div className="flex items-start gap-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#F26522]">
                    <Hash className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-tight text-navy/40">
                      {isAdvisor ? 'Employee ID' : 'Student ID'}
                    </p>
                    <p className="text-[11px] font-bold text-[#F26522] truncate">
                      {member.student_id || 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {/* Blood Group */}
              <div className="flex items-start gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                  <Droplet className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-tight text-navy/40">
                    Blood Group
                  </p>
                  <p className="text-[11px] font-bold text-navy truncate">
                    {member.blood_group || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Phone */}
              {showSensitiveInfo && (
                <div className="flex items-start gap-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <Phone className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-tight text-navy/40">
                      Phone
                    </p>
                    <a
                      href={`tel:${member.phone}`}
                      className="block text-[11px] font-bold text-navy transition-colors hover:text-[#F26522] truncate"
                    >
                      {member.phone || 'N/A'}
                    </a>
                  </div>
                </div>
              )}

              {/* Hobby */}
              <div className="flex items-start gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
                  <Star className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-tight text-navy/40">
                    Hobby
                  </p>
                  <p className="text-[11px] font-bold text-navy truncate">
                    {member.hobby || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Student Address */}
              {showSensitiveInfo && (
                <div className="flex items-start gap-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Building2 className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-tight text-navy/40">
                      Address
                    </p>
                    <p className="text-[11px] font-bold text-navy truncate" title={member.student_address}>
                      {member.student_address || 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="flex items-start gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Mail className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-tight text-navy/40">
                    Email
                  </p>
                  <a
                    href={`mailto:${member.email}`}
                    className="block text-[11px] font-bold text-navy transition-colors hover:text-[#F26522] truncate"
                    title={member.email}
                  >
                    {member.email || 'N/A'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
