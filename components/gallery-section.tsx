'use client'

import { useState, useEffect } from 'react'
import { Camera, Image as ImageIcon, Loader2, ChevronRight, ArrowLeft, X, ChevronLeft, ChevronRight as ChevronRightIcon, Images } from 'lucide-react'
import { org } from '@/lib/site-data'
import { supabase } from '@/lib/supabase'
import { MediaBackground } from '@/components/media-background'

type GalleryCategory = {
  id: string
  name: string
  created_at: string
  // Dynamically populated
  cover_image?: string
  album_count?: number
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

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

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

  // Handle Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight') showNextImage()
      if (e.key === 'ArrowLeft') showPrevImage()
    }
    window.addEventListener('keydown', handleKeyDown)
    // Lock body scroll
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [lightboxIndex, images])

  const loadData = async () => {
    setIsLoading(true)
    try {
      if (!currentCategory) {
        // Load Categories with their album count and a representative cover image
        const { data: cats, error: catsError } = await supabase.from('gallery_categories').select('*').order('created_at', { ascending: false })
        if (catsError) throw catsError

        // Fetch albums to get counts and covers
        const { data: allAlbums, error: albumsError } = await supabase.from('gallery_albums').select('category_id, cover_image').order('created_at', { ascending: false })
        if (albumsError) throw albumsError

        const enrichedCats = (cats as GalleryCategory[]).map(cat => {
          const catAlbums = allAlbums?.filter(a => a.category_id === cat.id) || []
          return {
            ...cat,
            album_count: catAlbums.length,
            cover_image: catAlbums.length > 0 ? catAlbums[0].cover_image : undefined
          }
        })
        setCategories(enrichedCats)
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

  const showNextImage = () => {
    if (lightboxIndex !== null && images.length > 0) {
      setLightboxIndex((lightboxIndex + 1) % images.length)
    }
  }

  const showPrevImage = () => {
    if (lightboxIndex !== null && images.length > 0) {
      setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)
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
              className="flex items-center justify-center gap-2 bg-secondary text-navy px-4 py-2 rounded-xl font-bold hover:bg-secondary/80 transition-all text-sm sm:w-auto w-full group"
            >
              <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
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
                <Images className="size-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-navy mb-2">Check back later!</h3>
                <p className="text-muted-foreground">We haven't uploaded any collections yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
                {categories.map(cat => (
                  <div 
                    key={cat.id} 
                    onClick={() => setCurrentCategory(cat)}
                    className="group relative flex flex-col rounded-[2rem] overflow-hidden cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#F26522]/20 transition-all duration-500 bg-card border border-border/50"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-[#F26522]/10 to-transparent">
                      {cat.cover_image ? (
                        <img src={cat.cover_image} alt={cat.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                          <Images className="size-24 text-[#F26522]" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/90 via-navy-deep/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                      
                      <div className="absolute inset-0 p-8 flex flex-col justify-end transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-medium tracking-wide text-white w-fit mb-3 border border-white/20">
                          <Images className="size-3" />
                          {cat.album_count || 0} {(cat.album_count === 1) ? 'Album' : 'Albums'}
                        </span>
                        <h3 className="text-3xl font-bold text-white mb-2 leading-tight">{cat.name}</h3>
                        <p className="text-white/70 text-sm flex items-center gap-1 font-medium">
                          Explore Collection <ChevronRight className="size-4 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500" />
                        </p>
                      </div>
                    </div>
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
                    className="group relative flex flex-col rounded-3xl overflow-hidden cursor-pointer hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/10 transition-all duration-500 bg-card border border-border/50"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary/50">
                      <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
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
                {images.map((image, index) => (
                  <div 
                    key={image.id} 
                    onClick={() => setLightboxIndex(index)}
                    className="group relative break-inside-avoid rounded-2xl overflow-hidden bg-secondary shadow-sm hover:shadow-xl hover:shadow-black/10 transition-all duration-500 cursor-zoom-in"
                  >
                    {image.image_url.includes('video') ? (
                      <video src={image.image_url} className="w-full object-cover transform group-hover:scale-[1.02] transition-transform duration-700" preload="metadata" />
                    ) : (
                      <img src={image.image_url} alt={image.caption || 'Gallery image'} className="w-full object-cover transform group-hover:scale-[1.02] transition-transform duration-700" loading="lazy" />
                    )}
                    
                    {image.image_url.includes('video') && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                         <div className="size-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center border border-white/50">
                           <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                         </div>
                      </div>
                    )}

                    {image.caption && !image.image_url.includes('video') && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
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

      {/* Lightbox Modal */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <button 
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 z-50 p-2 text-white/50 hover:text-white bg-black/20 hover:bg-white/10 rounded-full backdrop-blur-md transition-all"
          >
            <X className="size-6" />
          </button>

          {images.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); showPrevImage(); }}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 p-3 text-white/50 hover:text-white bg-black/20 hover:bg-white/10 rounded-full backdrop-blur-md transition-all"
              >
                <ChevronLeft className="size-8" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); showNextImage(); }}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 p-3 text-white/50 hover:text-white bg-black/20 hover:bg-white/10 rounded-full backdrop-blur-md transition-all"
              >
                <ChevronRightIcon className="size-8" />
              </button>
            </>
          )}

          <div 
            className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-16"
            onClick={() => setLightboxIndex(null)}
          >
            <div className="relative max-w-7xl max-h-full w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
              {images[lightboxIndex].image_url.includes('video') ? (
                <video 
                  src={images[lightboxIndex].image_url} 
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                  controls 
                  autoPlay
                  controlsList="nodownload" 
                />
              ) : (
                <img 
                  src={images[lightboxIndex].image_url} 
                  alt={images[lightboxIndex].caption || 'Expanded image'}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
              )}
            </div>
            {images[lightboxIndex].caption && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl max-w-3xl text-center shadow-2xl animate-in slide-in-from-bottom-10">
                <p className="text-white/90 text-sm md:text-base font-medium">{images[lightboxIndex].caption}</p>
              </div>
            )}
            <div className="absolute bottom-8 right-8 text-white/30 font-medium text-sm">
              {lightboxIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
