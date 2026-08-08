'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
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
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-navy-soft">
            Membership
          </span>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-navy text-balance sm:text-4xl">
            Why Join UIUJEF?
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
            Membership is more than a line on your CV — it is a working community that pushes you
            to research, speak, and lead.
          </p>
        </div>

        {isLoading ? (
          <div className="py-24 text-center">
            <LucideIcons.Loader2 className="size-10 animate-spin mx-auto text-[#F26522] mb-4" />
            <p className="text-lg font-semibold text-navy">Loading membership benefits...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-lg font-semibold text-navy">No membership benefits added yet.</p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((benefit) => {
              // Dynamically get the icon from lucide-react, fallback to Star
              const IconName = benefit.icon || 'Star'
              const Icon = (LucideIcons as any)[IconName] || LucideIcons.Star
              
              // Special highlighting logic
              const isHultPrize = benefit.title.toLowerCase().includes('hult')
              const isSeminar = benefit.title.toLowerCase().includes('seminar')
              const isHighlighted = isHultPrize || isSeminar

              return (
                <article
                  key={benefit.id}
                  className={`group relative min-h-[18rem] overflow-hidden rounded-2xl sm:min-h-[20rem] border-2 transition-all duration-300 hover:-translate-y-1 ${isHighlighted ? 'border-gold shadow-lg shadow-gold/20' : 'border-transparent'}`}
                >
                  <Image
                    src={benefit.image_url || '/placeholder.svg'}
                    alt={benefit.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <div
                    aria-hidden="true"
                    className={`absolute inset-0 ${isHighlighted ? 'bg-gradient-to-t from-navy-deep/95 via-navy-deep/80 to-navy-deep/40' : 'bg-gradient-to-t from-navy-deep/95 via-navy-deep/75 to-navy/35'}`}
                  />
                  <div className="relative flex h-full min-h-[18rem] flex-col justify-end p-6 sm:min-h-[20rem]">
                    {isHighlighted && (
                      <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-gold/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-navy shadow-sm backdrop-blur-md">
                        Featured
                      </span>
                    )}
                    <span className={`inline-flex size-10 items-center justify-center rounded-xl border backdrop-blur-sm ${isHighlighted ? 'border-gold bg-gold/20 text-gold shadow-[0_0_15px_rgba(244,196,48,0.3)]' : 'border-white/20 bg-white/10 text-white'}`}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h2 className={`mt-4 text-base font-bold ${isHighlighted ? 'text-gold' : 'text-white'}`}>{benefit.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/80">{benefit.description}</p>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
