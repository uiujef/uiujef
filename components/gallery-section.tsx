'use client'

import { useState, useEffect } from 'react'
import { Camera, Image as ImageIcon, Loader2 } from 'lucide-react'
import { org } from '@/lib/site-data'
import { supabase } from '@/lib/supabase'
import { MediaBackground } from '@/components/media-background'

type GalleryItem = {
  id: string
  title: string
  image_url: string
  is_pinned: boolean
  pinned_at: string | null
  created_at: string
}

export function GallerySection() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [bgMedia, setBgMedia] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const { data: settingsData } = await supabase.from('site_settings').select('bg_gallery').limit(1).maybeSingle()
        if (settingsData && settingsData.bg_gallery) {
          setBgMedia(settingsData.bg_gallery)
        }

        const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false })
        if (error) throw error
        
        if (data) {
          const sorted = [...(data as GalleryItem[])].sort((a, b) => {
            if (a.is_pinned && !b.is_pinned) return -1
            if (!a.is_pinned && b.is_pinned) return 1
            if (a.is_pinned && b.is_pinned) {
              const dateA = a.pinned_at ? new Date(a.pinned_at).getTime() : 0
              const dateB = b.pinned_at ? new Date(b.pinned_at).getTime() : 0
              return dateB - dateA
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
          setItems(sorted)
        }
      } catch (err) {
        console.error('Error fetching gallery:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <section className="bg-background">
      <div className="relative overflow-hidden border-b border-border bg-navy-deep min-h-[300px] flex items-center">
        <MediaBackground url={bgMedia} overlayClassName="bg-navy-deep/70" />
        <div className="relative mx-auto max-w-6xl w-full px-5 py-16 sm:px-6 lg:px-8 lg:py-20 z-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium tracking-wide text-gold-soft">
              <Camera className="size-3.5" aria-hidden="true" />
              Moments
            </span>
            <h1 className="mt-5 font-serif text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl lg:text-5xl">
              {org.shortName} <span className="text-gold">Gallery</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/70 text-pretty sm:text-lg">
              Photos and moments from our summits, workshops, and community events — updated as we grow.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
        {isLoading ? (
          <div className="py-24 text-center">
            <Loader2 className="size-10 animate-spin mx-auto text-[#F26522] mb-4" />
            <p className="text-lg font-semibold text-navy">Loading gallery...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-lg font-semibold text-navy">No images uploaded yet.</p>
          </div>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F26522]/30 hover:shadow-lg hover:shadow-[#F26522]/10 cursor-pointer"
              >
                <div className="relative">
                  <img src={item.image_url} alt={item.title} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                    <h2 className="text-sm font-semibold text-white">{item.title}</h2>
                  </div>
                  {item.is_pinned && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow backdrop-blur-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
                        Pinned
                      </span>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
