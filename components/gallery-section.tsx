'use client'

import { useState, useEffect } from 'react'
import { Camera, Image as ImageIcon, Loader2, FolderOpen, ChevronRight, ArrowLeft } from 'lucide-react'
import { org } from '@/lib/site-data'
import { supabase } from '@/lib/supabase'
import { MediaBackground } from '@/components/media-background'

type GalleryCategory = {
  id: string
  name: string
  created_at: string
}

type GalleryAlbum = {
  id: string
  category_id: string
  title: string
  event_date: string | null
  cover_image: string
  created_at: string
}

type GalleryImage = {
  id: string
  album_id: string
  caption: string | null
  image_url: string
  created_at: string
}

export function GallerySection() {
  const [categories, setCategories] = useState<GalleryCategory[]>([])
  const [albums, setAlbums] = useState<GalleryAlbum[]>([])
  const [images, setImages] = useState<GalleryImage[]>([])

  const [currentCategory, setCurrentCategory] = useState<GalleryCategory | null>(null)
  const [currentAlbum, setCurrentAlbum] = useState<GalleryAlbum | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [bgMedia, setBgMedia] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBg() {
      const { data } = await supabase.from('site_settings').select('bg_gallery').limit(1).maybeSingle()
      if (data && data.bg_gallery) {
        setBgMedia(data.bg_gallery)
      }
    }
    fetchBg()
  }, [])

  useEffect(() => {
    loadData()
  }, [currentCategory, currentAlbum])

  const loadData = async () => {
    setIsLoading(true)
    try {
      if (!currentCategory) {
        // Load Categories
        const { data, error } = await supabase.from('gallery_categories').select('*').order('created_at', { ascending: false })
        if (error) throw error
        setCategories(data as GalleryCategory[])
      } else if (!currentAlbum) {
        // Load Albums for Category
        const { data, error } = await supabase.from('gallery_albums').select('*').eq('category_id', currentCategory.id).order('created_at', { ascending: false })
        if (error) throw error
        setAlbums(data as GalleryAlbum[])
      } else {
        // Load Images for Album
        const { data, error } = await supabase.from('gallery_images').select('*').eq('album_id', currentAlbum.id).order('created_at', { ascending: false })
        if (error) throw error
        setImages(data as GalleryImage[])
      }
    } catch (err: any) {
      console.error('Database Error:', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="bg-background min-h-screen">
      {/* Hero Section */}
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

      {/* Main Gallery Area */}
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        
        {/* Breadcrumbs & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-4 border-b border-border/50">
          <div className="flex flex-wrap items-center text-sm sm:text-base font-semibold text-muted-foreground gap-2">
            <button 
              onClick={() => { setCurrentCategory(null); setCurrentAlbum(null) }} 
              className={`hover:text-[#F26522] transition-colors ${!currentCategory ? 'text-navy text-lg sm:text-xl font-bold' : ''}`}
            >
              Collections
            </button>
            {currentCategory && (
              <>
                <ChevronRight className="size-4 shrink-0 opacity-50" />
                <button 
                  onClick={() => setCurrentAlbum(null)} 
                  className={`hover:text-[#F26522] transition-colors ${!currentAlbum ? 'text-navy text-lg sm:text-xl font-bold' : ''}`}
                >
                  {currentCategory.name}
                </button>
              </>
            )}
            {currentAlbum && (
              <>
                <ChevronRight className="size-4 shrink-0 opacity-50" />
                <span className="text-navy text-lg sm:text-xl font-bold truncate max-w-[200px] sm:max-w-xs">{currentAlbum.title}</span>
              </>
            )}
          </div>
          
          {(currentCategory || currentAlbum) && (
            <button 
              onClick={() => { if (currentAlbum) setCurrentAlbum(null); else setCurrentCategory(null) }} 
              className="flex items-center justify-center gap-2 bg-secondary text-navy px-4 py-2 rounded-xl font-bold hover:bg-secondary/80 transition-all text-sm sm:w-auto w-full"
            >
              <ArrowLeft className="size-4" />
              Go Back
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="py-24 text-center animate-in fade-in duration-500">
              <Loader2 className="size-10 animate-spin mx-auto text-[#F26522] mb-4" />
              <p className="text-lg font-semibold text-navy">Loading gallery...</p>
            </div>
          ) : !currentCategory ? (
            /* LEVEL 1: CATEGORIES */
            categories.length === 0 ? (
              <div className="py-24 text-center animate-in fade-in duration-500">
                <FolderOpen className="size-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-navy mb-2">Check back later!</h3>
                <p className="text-muted-foreground">We haven't uploaded any collections yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 fade-in duration-700">
                {categories.map(cat => (
                  <div 
                    key={cat.id} 
                    onClick={() => setCurrentCategory(cat)}
                    className="group flex flex-col bg-card border border-border/80 rounded-3xl p-8 cursor-pointer hover:shadow-xl hover:shadow-[#F26522]/5 hover:border-[#F26522]/20 transition-all duration-300"
                  >
                    <div className="size-16 rounded-2xl bg-[#F26522]/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#F26522]/20 transition-all duration-300">
                      <FolderOpen className="size-8 text-[#F26522]" />
                    </div>
                    <h3 className="text-2xl font-bold text-navy mb-2 group-hover:text-[#F26522] transition-colors">{cat.name}</h3>
                    <p className="text-muted-foreground text-sm flex items-center gap-1 group-hover:text-navy transition-colors">
                      Explore Collection <ChevronRight className="size-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : !currentAlbum ? (
            /* LEVEL 2: ALBUMS */
            albums.length === 0 ? (
              <div className="py-24 text-center animate-in fade-in duration-500">
                <ImageIcon className="size-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-navy mb-2">Empty Collection</h3>
                <p className="text-muted-foreground">There are no albums in this collection yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
                {albums.map(album => (
                  <article 
                    key={album.id} 
                    onClick={() => setCurrentAlbum(album)}
                    className="group relative flex flex-col rounded-3xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#F26522]/10 transition-all duration-500 bg-card border border-border/50"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary/50">
                      <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/80 via-navy-deep/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                      <div className="absolute inset-0 p-6 flex flex-col justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <h3 className="text-2xl font-bold text-white leading-tight mb-2">{album.title}</h3>
                        {album.event_date && (
                          <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                            {new Date(album.event_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : (
            /* LEVEL 3: IMAGES */
            images.length === 0 ? (
              <div className="py-24 text-center animate-in fade-in duration-500">
                <ImageIcon className="size-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-navy mb-2">Empty Album</h3>
                <p className="text-muted-foreground">No photos have been uploaded to this album yet.</p>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-700">
                {images.map(image => (
                  <div key={image.id} className="group relative break-inside-avoid rounded-2xl overflow-hidden bg-secondary shadow-sm hover:shadow-xl hover:shadow-[#F26522]/10 transition-all duration-500 cursor-pointer">
                    {image.image_url.includes('video') ? (
                      <video src={image.image_url} className="w-full object-cover transform group-hover:scale-[1.02] transition-transform duration-700" controls controlsList="nodownload" preload="metadata" />
                    ) : (
                      <img src={image.image_url} alt={image.caption || 'Gallery image'} className="w-full object-cover transform group-hover:scale-[1.02] transition-transform duration-700" loading="lazy" />
                    )}
                    
                    {image.caption && !image.image_url.includes('video') && (
                      <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/90 via-navy-deep/20 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                        <h4 className="text-white font-medium text-sm md:text-base leading-tight drop-shadow-md">{image.caption}</h4>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  )
}
