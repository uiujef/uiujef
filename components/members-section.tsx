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
import { MediaBackground } from '@/components/media-background'

type Tab = 'advisors' | 'executive' | 'general' | 'alumni'

const EXECUTIVE_RANKS: Record<string, number> = {
  'President': 1,
  'Vice President': 2,
  'General Secretary': 3,
  'Treasurer': 3,
  'Executive of Events': 4,
  'Executive of Communication': 5,
  'Executive of PR & Marketing': 6,
  'Executive Member': 7,
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
    <div className="mb-8 flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
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
  const [bgMedia, setBgMedia] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMembers() {
      try {
        const { data: settingsData } = await supabase.from('site_settings').select('bg_members').limit(1).maybeSingle()
        if (settingsData && settingsData.bg_members) {
          setBgMedia(settingsData.bg_members)
        }

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
  const getDisplayRole = (m: Member) => m.role === 'Other (Custom Role)' && m.custom_role ? m.custom_role : m.role

  const executives = members
    .filter(m => Object.keys(EXECUTIVE_RANKS).includes(getDisplayRole(m)))
    .sort((a, b) => EXECUTIVE_RANKS[getDisplayRole(a)] - EXECUTIVE_RANKS[getDisplayRole(b)])
  const generalMembers = members.filter(m => m.role === 'General Member')
  const alumni = members.filter(m => m.role === 'Alumni')

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'executive',  label: 'Executive Panel',  icon: Star,          count: executives.length },
    { id: 'general',    label: 'General Members',  icon: UserCheck,     count: generalMembers.length },
    { id: 'advisors',   label: 'Advisors',         icon: GraduationCap, count: advisors.length },
    { id: 'alumni',     label: 'Alumni',           icon: History,       count: alumni.length },
  ]

  // Executive Hierarchy Tiers
  const president = executives.filter(m => getDisplayRole(m) === 'President')
  const vicePresidents = executives.filter(m => getDisplayRole(m) === 'Vice President')
  const generalSecretaryAndTreasurer = executives.filter(m => {
    const r = getDisplayRole(m)
    return r.includes('General Secretary') || r === 'Treasurer'
  })
  const execOfEvents = executives.filter(m => getDisplayRole(m) === 'Executive of Events')
  const execOfComm = executives.filter(m => getDisplayRole(m) === 'Executive of Communication')
  const execOfPR = executives.filter(m => getDisplayRole(m) === 'Executive of PR & Marketing')
  const execMembers = executives.filter(m => getDisplayRole(m) === 'Executive Member')

  return (
    <section className="bg-background min-h-screen">
      {/* ── Page hero ── */}
      <div className="relative overflow-hidden border-b border-border bg-navy-deep min-h-[300px] flex items-center">
        <MediaBackground url={bgMedia} overlayClassName="bg-navy-deep/70" />
        <div className="relative mx-auto max-w-6xl w-full px-5 py-8 sm:px-6 lg:px-8 lg:py-10 z-10">
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
          className="mb-8 flex w-full flex-col gap-2 rounded-2xl border border-border/80 bg-card/60 p-1.5 backdrop-blur-sm sm:flex-row"
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
                    <div className="grid gap-5 lg:grid-cols-2 mt-8">
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

            {/* EXECUTIVE PANEL (Pyramid Layout) */}
            <div id="panel-executive" role="tabpanel" aria-labelledby="tab-executive" hidden={activeTab !== 'executive'}>
              {activeTab === 'executive' && (
                <>
                  <SectionHeader
                    icon={Star}
                    title="Executive Panel"
                    subtitle="The elected student leaders driving UIUJEF's mission — structured from the President down through every department."
                  />
                  {executives.length > 0 ? (
                    <div className="flex flex-col items-center gap-12 sm:gap-16 w-full py-8">
                      
                      {/* Tier 1: President */}
                      {president.length > 0 && (
                        <div className="flex justify-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-0">
                          <div className="w-full max-w-sm sm:scale-110 transition-transform">
                            {president.map(m => (
                              <MemberCard key={m.id} member={m} onClick={() => setSelectedMember(m)} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tier 2: Vice Presidents */}
                      {vicePresidents.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                          {vicePresidents.map(m => (
                            <div key={m.id} className="w-full sm:w-80">
                              <MemberCard member={m} onClick={() => setSelectedMember(m)} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tier 3: General Secretary & Treasurer */}
                      {generalSecretaryAndTreasurer.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                          {generalSecretaryAndTreasurer.map(m => (
                            <div key={m.id} className="w-full sm:w-80">
                              <MemberCard member={m} onClick={() => setSelectedMember(m)} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tier 4: Executive of Events */}
                      {execOfEvents.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                          {execOfEvents.map(m => (
                            <div key={m.id} className="w-full sm:w-72">
                              <MemberCard member={m} onClick={() => setSelectedMember(m)} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tier 5: Executive of Communication */}
                      {execOfComm.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
                          {execOfComm.map(m => (
                            <div key={m.id} className="w-full sm:w-72">
                              <MemberCard member={m} onClick={() => setSelectedMember(m)} />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Tier 6: Executive of PR & Marketing */}
                      {execOfPR.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
                          {execOfPR.map(m => (
                            <div key={m.id} className="w-full sm:w-72">
                              <MemberCard member={m} onClick={() => setSelectedMember(m)} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Additional: General Executive Members */}
                      {execMembers.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
                          {execMembers.map(m => (
                            <div key={m.id} className="w-full sm:w-[260px]">
                              <MemberCard member={m} onClick={() => setSelectedMember(m)} />
                            </div>
                          ))}
                        </div>
                      )}
                      
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
                    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-8">
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
                    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-8">
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
        <div className="mt-20 rounded-3xl border border-border bg-gradient-to-br from-secondary/80 to-card p-8 text-center backdrop-blur-sm sm:p-12 shadow-sm">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-[#F26522]/10 text-[#F26522]">
            <Users className="size-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-navy sm:text-3xl">
            Want to Join the Team?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Membership applications open each semester. Apply now to become part of
            the most impactful student community at {org.university}.
          </p>
          <a
            href="/join"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#F26522] px-8 text-sm font-bold text-white transition-all duration-300 hover:bg-[#FF7A3D] hover:scale-105 active:scale-95 hover:shadow-xl hover:shadow-[#F26522]/30"
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
    <div className="bg-white rounded-3xl border border-border p-12 text-center shadow-sm w-full mt-8">
      <div className="mx-auto size-16 bg-secondary rounded-full flex items-center justify-center mb-4">
        <UserCircle className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-bold text-navy mb-2">Nothing Here Yet</h3>
      <p className="text-muted-foreground max-w-sm mx-auto">{message}</p>
    </div>
  )
}
