'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import { supabase } from '@/lib/supabase'

type WhyJoinItem = {
  id: string
  title: string
  description: string
  icon: string
  image_url: string
}

export function WhyJoinSection() {
  const [items, setItems] = useState<WhyJoinItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.from('why_join_content').select('*').order('created_at', { ascending: true })
        if (error) throw error
        if (data) setItems(data)
      } catch (err) {
        console.error('Error fetching why join content:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <section id="why-join" className="bg-secondary">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#F26522]">
            Membership
          </span>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-navy text-balance sm:text-5xl mb-6">
            A Transformative Step For Your Future
          </h1>
          <div className="space-y-5 text-lg leading-relaxed text-muted-foreground text-pretty">
            <p>
              Joining the UIU Junior Economists' Forum (UIUJEF) is more than just adding a line to your resume—it is a conscious decision to step into an environment that bridges the gap between theoretical economics, data science, and real-world practical application. We believe that understanding global markets and economic trends requires not just academic knowledge, but the hands-on experience to analyze, interpret, and lead in complex situations.
            </p>
            <p>
              As a member, you become part of a working community that constantly pushes you to explore new horizons. You will build a lifelong network of ambitious, like-minded peers who are just as passionate about making an impact as you are. Whether it's organizing high-stakes seminars, publishing research, or collaborating on data-driven projects, you'll be surrounded by individuals who elevate your potential.
            </p>
            <p>
              Furthermore, UIUJEF is a launchpad for cultivating true leadership. We prepare you for prestigious global platforms, such as the Hult Prize, by equipping you with the critical thinking, public speaking, and problem-solving skills necessary to stand out. Here, you don't just observe the changing economic landscape—you learn how to actively shape it.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-32 text-center">
            <LucideIcons.Loader2 className="size-12 animate-spin mx-auto text-[#F26522] mb-6" />
            <p className="text-xl font-medium text-navy/70">Loading membership benefits...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-xl font-medium text-navy/70">No membership benefits added yet.</p>
          </div>
        ) : (
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((benefit) => {
              // Dynamically get the icon from lucide-react, fallback to treating as emoji/string
              const IconName = benefit.icon || 'Star'
              const LucideIcon = (LucideIcons as any)[IconName]
              const isLucide = !!LucideIcon
              
              // Special highlighting logic
              const isHultPrize = benefit.title.toLowerCase().includes('hult')
              const isSeminar = benefit.title.toLowerCase().includes('seminar')
              const isHighlighted = isHultPrize || isSeminar

              return (
                <article
                  key={benefit.id}
                  className={`group relative min-h-[22rem] overflow-hidden rounded-3xl border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${isHighlighted ? 'border-gold/40 shadow-xl shadow-gold/10' : 'border-white/10 shadow-lg'}`}
                >
                  <Image
                    src={benefit.image_url || '/placeholder.svg'}
                    alt={benefit.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div
                    aria-hidden="true"
                    className={`absolute inset-0 transition-opacity duration-500 ${isHighlighted ? 'bg-gradient-to-t from-navy-deep via-navy-deep/80 to-navy-deep/20 opacity-90 group-hover:opacity-100' : 'bg-gradient-to-t from-navy-deep via-navy-deep/80 to-transparent opacity-80 group-hover:opacity-90'}`}
                  />
                  
                  <div className="relative flex h-full flex-col justify-end p-6 sm:p-8 z-10">
                    {isHighlighted && (
                      <span className="absolute top-6 right-6 inline-flex items-center rounded-full bg-gradient-to-r from-gold to-yellow-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-navy shadow-md">
                        Featured
                      </span>
                    )}
                    <span className={`inline-flex size-12 items-center justify-center rounded-2xl border backdrop-blur-md transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${isHighlighted ? 'border-gold/40 bg-gold/20 text-gold shadow-[0_0_20px_rgba(244,196,48,0.3)]' : 'border-white/20 bg-white/10 text-white group-hover:bg-[#F26522]/20 group-hover:text-[#F26522] group-hover:border-[#F26522]/30'}`}>
                      {isLucide ? (
                        <LucideIcon className="size-6" aria-hidden="true" />
                      ) : (
                        <span 
                          className="text-2xl leading-none flex items-center justify-center" 
                          style={{ fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif" }}
                        >
                          {benefit.icon}
                        </span>
                      )}
                    </span>
                    <div className="mt-6 transform transition-transform duration-500 translate-y-2 group-hover:translate-y-0">
                      <h2 className={`text-xl font-serif font-bold tracking-tight ${isHighlighted ? 'text-gold' : 'text-white'}`}>{benefit.title}</h2>
                      <p className="mt-3 text-sm leading-relaxed text-white/70 transition-colors duration-300 group-hover:text-white/90">{benefit.description}</p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Meaningful CTA Section */}
        <div className="mt-24 rounded-3xl bg-gradient-to-br from-navy-deep to-navy p-10 sm:p-16 text-center shadow-2xl relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute -top-24 -right-24 size-64 rounded-full bg-gold/10 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-[#F26522]/10 blur-3xl"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
              Ready to shape your future?
            </h2>
            <p className="text-lg text-white/80 mb-10 text-balance">
              Become a part of our legacy today. Join the community that builds leaders, sharpens minds, and connects ambition with opportunity.
            </p>
            <Link 
              href="/join" 
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#F26522] to-orange-500 px-8 py-4 text-base font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-[#F26522]/25"
            >
              Apply for Membership
              <LucideIcons.ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
