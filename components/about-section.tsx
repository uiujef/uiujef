import { BookOpen, GraduationCap, MessageSquare, Target, Telescope, Globe, Briefcase, HeartHandshake } from 'lucide-react'
import { org, timeline } from '@/lib/site-data'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { SectionHeader } from '@/components/ui/section-header'

const pillars = [
  {
    id: 'academic_research',
    icon: BookOpen,
    title: 'Academic & Research Excellence',
    description:
      'Cultivating a strong foundation in economic theory through faculty-guided research, policy briefs, publications, and advanced academic seminars.',
  },
  {
    id: 'global_competitions',
    icon: Globe,
    title: 'Global Competitions & Leadership',
    description:
      'Organizing prestigious international events like the Hult Prize and empowering members to compete on global stages, building the leaders of tomorrow.',
  },
  {
    id: 'industry_experience',
    icon: Briefcase,
    title: 'Industry & Field Experience',
    description:
      'Bridging theory and real-world application by organizing exclusive corporate visits, industry tours, and recreational educational tours across Bangladesh.',
  },
  {
    id: 'social_impact',
    icon: HeartHandshake,
    title: 'Social Responsibility & Impact',
    description:
      'Taking active roles in national crises such as emergency Flood Relief, and organizing educational seminars and workshops at schools for disabled children.',
  },
]

export async function AboutSection() {
  const { data: settings } = await supabase
    .from('site_settings')
    .select('bg_mission, bg_vision, bg_journey_1, bg_journey_2, bg_journey_3, bg_journey_4, bg_journey_5')
    .limit(1)
    .maybeSingle()

  const bgMission = settings?.bg_mission || ''
  const bgVision = settings?.bg_vision || ''
  const journeyImages = [
    settings?.bg_journey_1 || '',
    settings?.bg_journey_2 || '',
    settings?.bg_journey_3 || '',
    settings?.bg_journey_4 || '',
    settings?.bg_journey_5 || '',
  ]

  return (
    <>
      {/* Hero Intro */}
      <section className="relative overflow-hidden bg-navy-deep">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(242,101,34,0.18),transparent_50%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-1/3 size-96 rounded-full bg-navy/40 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft backdrop-blur-md">
              {org.name}
            </span>
            <h1 className="mt-8 font-serif text-4xl font-bold leading-[1.08] tracking-tight text-white text-balance sm:text-5xl lg:text-6xl xl:text-7xl">
              Shaping the Economic Minds of{' '}
              <span className="bg-gradient-to-r from-gold via-gold-soft to-gold bg-clip-text text-transparent">
                Tomorrow.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/65 text-pretty sm:text-lg">
              Since 2016, {org.shortName} has been {org.university}&apos;s premier student forum for
              economics — where theory meets policy, debate sharpens judgment, and the next
              generation of Bangladeshi economists finds its voice.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="relative border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto flex justify-center text-center">
            <SectionHeader subtitle="Our Purpose" title="Mission & Vision" className="mx-auto flex flex-col items-center" titleClassName="text-center" />
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
            <article 
              className="group relative overflow-hidden rounded-3xl border border-border/70 p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-xl sm:p-10"
              style={{
                backgroundImage: bgMission ? `url(${bgMission})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/60 transition-colors duration-300 group-hover:bg-black/50" />
              <div className="relative z-10">
                <div className="inline-flex size-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold/20 text-gold transition-colors duration-300 group-hover:bg-gold/30">
                  <Target className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-6 font-serif text-2xl font-bold text-white">Mission</h3>
                <p className="mt-4 text-base leading-relaxed text-white/90 text-pretty">
                  Bridging classroom economic theory with real-world policy and analytical skills —
                  empowering UIU students to think critically, communicate persuasively, and apply
                  economics to the challenges Bangladesh faces today.
                </p>
              </div>
            </article>

            <article 
              className="group relative overflow-hidden rounded-3xl border border-border/70 p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-xl sm:p-10"
              style={{
                backgroundImage: bgVision ? `url(${bgVision})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/60 transition-colors duration-300 group-hover:bg-black/50" />
              <div className="relative z-10">
                <div className="inline-flex size-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold/20 text-gold transition-colors duration-300 group-hover:bg-gold/30">
                  <Telescope className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-6 font-serif text-2xl font-bold text-white">Vision</h3>
                <p className="mt-4 text-base leading-relaxed text-white/90 text-pretty">
                  Building a generation of competent leaders and researchers — economists who combine
                  academic excellence with integrity, drive national discourse, and shape policy from
                  the classroom to the boardroom.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto flex flex-col items-center text-center">
            <SectionHeader subtitle="What We Do" title="Core Pillars" className="mx-auto flex flex-col items-center" titleClassName="text-center" />
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
              Four foundations that define how {org.shortName} develops economists who lead with
              evidence, not assumption.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar) => {
              const Icon = pillar.icon
              return (
                <article
                  key={pillar.id}
                  className="group rounded-2xl border border-border/70 bg-card/70 p-7 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#F26522]/30 hover:shadow-lg hover:shadow-[#F26522]/10"
                >
                  <div className="inline-flex size-12 items-center justify-center rounded-xl bg-navy text-white transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#F26522]">
                    <Icon className="size-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-bold text-navy group-hover:text-[#F26522] transition-colors">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                    {pillar.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeader subtitle="Our Journey" title="2016 → Present" />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              A decade of growth — from a reading circle to one of UIU&apos;s most active academic
              communities.
            </p>
          </div>

          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {timeline.map((item, index) => (
              <li
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-border/70 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-lg"
                style={{
                  backgroundImage: journeyImages[index] ? `url(${journeyImages[index]})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-black/60 transition-colors duration-300 group-hover:bg-black/40" />
                <div className="relative z-10 flex flex-col h-full min-h-[160px]">
                  <p className="font-serif text-2xl font-bold text-gold">{item.year}</p>
                  <p className="mt-2 text-sm font-semibold text-white group-hover:text-gold-soft transition-colors">{item.title}</p>
                  <p className="mt-auto pt-4 text-xs leading-relaxed text-white/80">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  )
}
