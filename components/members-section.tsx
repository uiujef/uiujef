'use client'

import { useState, useEffect } from 'react'
import { Users, GraduationCap, Star, UserCheck, History, Loader2, UserCircle } from 'lucide-react'
import type { Member } from '@/data/members'
import { AdvisorCard } from '@/components/advisor-card'
import { MemberCard } from '@/components/member-card'
import { MemberModal } from '@/components/member-modal'
import { org } from '@/lib/site-data'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

type Tab = 'advisors' | 'executive' | 'general' | 'alumni'

const EXECUTIVE_RANKS: Record<string, number> = {
  'President': 1,
  'Vice President': 2,
  'General Secretary': 3,
  'Treasurer': 4,
  'Executive Member': 5,
}

// ─── Section header ──────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
}) {
  return (
    <div className="mb-6 flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#F26522]/10 text-[#F26522]">
        <Icon className="size-6" />
      </div>
      <div>
        <h2 className="font-serif text-2xl font-bold text-navy">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function MembersSection() {
  const [activeTab, setActiveTab] = useState<Tab>('executive')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchMembers() {
      try {
        const { data, error } = await supabase.from('members').select('*').order('name', { ascending: true })
        if (error) throw error
        if (data) {
          setMembers(data as Member[])
        }
      } catch (err: any) {
        console.error('Error fetching members:', err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMembers()
  }, [])

  // Categorize and sort members
  const advisors = members.filter(m => m.role === 'Advisor')
  const executives = members
    .filter(m => Object.keys(EXECUTIVE_RANKS).includes(m.role))
    .sort((a, b) => EXECUTIVE_RANKS[a.role] - EXECUTIVE_RANKS[b.role])
  const generalMembers = members.filter(m => m.role === 'General Member')
  const alumni = members.filter(m => m.role === 'Alumni')

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'executive',  label: 'Executive Panel',  icon: Star,          count: executives.length },
    { id: 'general',    label: 'General Members',  icon: UserCheck,     count: generalMembers.length },
    { id: 'advisors',   label: 'Advisors',         icon: GraduationCap, count: advisors.length },
    { id: 'alumni',     label: 'Alumni',           icon: History,       count: alumni.length },
  ]

  return (
    <section className="bg-background min-h-screen">
      {/* ── Page hero ── */}
      <div className="relative overflow-hidden border-b border-border bg-navy-deep">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(242,101,34,0.12),transparent_55%)]"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium tracking-wide text-gold-soft">
              <Users className="size-3.5" aria-hidden="true" />
              Our Community
            </span>
            <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl lg:text-5xl">
              Meet the <span className="text-gold">Members</span>
            </h1>
            <p className="mt-3 text-base leading-relaxed text-white/70 text-pretty sm:text-lg">
              From Faculty Advisors and Executive Panel to General
              Members and Alumni — explore every tier of the {org.shortName} community at{' '}
              {org.university}.
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* ── Tab navigation ── */}
        <div
          role="tablist"
          aria-label="Member categories"
          className="mb-6 flex w-full flex-col gap-2 rounded-2xl border border-border/80 bg-card/60 p-1.5 backdrop-blur-sm sm:flex-row"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                  activeTab === tab.id
                    ? 'bg-navy text-white shadow-md shadow-navy/20'
                    : 'text-muted-foreground hover:bg-secondary hover:text-navy',
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold',
                    activeTab === tab.id
                      ? 'bg-[#F26522]/20 text-[#F26522]'
                      : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="py-24 text-center">
            <Loader2 className="size-8 animate-spin mx-auto text-[#F26522] mb-4" />
            <p className="text-lg font-semibold text-navy">Loading members...</p>
          </div>
        ) : (
          <div className="min-h-[40vh]">
            {/* ADVISORS */}
            <div id="panel-advisors" role="tabpanel" aria-labelledby="tab-advisors" hidden={activeTab !== 'advisors'}>
              {activeTab === 'advisors' && (
                <>
                  <SectionHeader
                    icon={GraduationCap}
                    title="Faculty Advisors"
                    subtitle="Distinguished faculty members who provide academic guidance and strategic oversight to UIUJEF."
                  />
                  {advisors.length > 0 ? (
                    <div className="grid gap-5 lg:grid-cols-2">
                      {advisors.map((member) => (
                        <AdvisorCard key={member.id} member={member} onClick={() => setSelectedMember(member)} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="No advisors found." />
                  )}
                </>
              )}
            </div>

            {/* EXECUTIVE PANEL */}
            <div id="panel-executive" role="tabpanel" aria-labelledby="tab-executive" hidden={activeTab !== 'executive'}>
              {activeTab === 'executive' && (
                <>
                  <SectionHeader
                    icon={Star}
                    title="Executive Panel"
                    subtitle="The elected student leaders driving UIUJEF's mission — structured from the President down through every department."
                  />
                  {executives.length > 0 ? (
                    <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {executives.map((member) => (
                        <MemberCard key={member.id} member={member} onClick={() => setSelectedMember(member)} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="No executive members found." />
                  )}
                </>
              )}
            </div>

            {/* GENERAL MEMBERS */}
            <div id="panel-general" role="tabpanel" aria-labelledby="tab-general" hidden={activeTab !== 'general'}>
              {activeTab === 'general' && (
                <>
                  <SectionHeader
                    icon={UserCheck}
                    title="General Members"
                    subtitle="The heartbeat of UIUJEF — passionate students contributing to events, communications, and every initiative that moves the club forward."
                  />
                  {generalMembers.length > 0 ? (
                    <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {generalMembers.map((member) => (
                        <MemberCard key={member.id} member={member} onClick={() => setSelectedMember(member)} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="No general members found." />
                  )}
                </>
              )}
            </div>

            {/* ALUMNI */}
            <div id="panel-alumni" role="tabpanel" aria-labelledby="tab-alumni" hidden={activeTab !== 'alumni'}>
              {activeTab === 'alumni' && (
                <>
                  <SectionHeader
                    icon={History}
                    title="Alumni"
                    subtitle="Our graduated members who continue to inspire and support the legacy of UIUJEF."
                  />
                  {alumni.length > 0 ? (
                    <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {alumni.map((member) => (
                        <MemberCard key={member.id} member={member} onClick={() => setSelectedMember(member)} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="No alumni found." />
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Global modal (shared across all tabs) ── */}
        <MemberModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />

        {/* ── Join CTA ── */}
        <div className="mt-20 rounded-2xl border border-border bg-gradient-to-br from-secondary/80 to-card p-8 text-center backdrop-blur-sm sm:p-12">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#F26522]/10 text-[#F26522]">
            <Users className="size-7" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-navy">
            Want to Join the Team?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Membership applications open each semester. Apply now to become part of
            the most impactful student community at {org.university}.
          </p>
          <a
            href="/join"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#F26522] px-7 text-sm font-bold text-white transition-all duration-200 hover:bg-[#FF7A3D] hover:shadow-lg hover:shadow-[#F26522]/30"
          >
            Apply Now →
          </a>
        </div>
      </div>
    </section>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm w-full">
      <div className="mx-auto size-16 bg-secondary rounded-full flex items-center justify-center mb-4">
        <UserCircle className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-bold text-navy mb-2">Nothing Here Yet</h3>
      <p className="text-muted-foreground max-w-sm mx-auto">{message}</p>
    </div>
  )
}
