'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import { CalendarDays, ChevronRight } from 'lucide-react'
import { type NewsArticle } from '@/data/news'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { MediaBackground } from '@/components/media-background'

export default function NewsPage() {
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null)
  const [news, setNews] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [bgMedia, setBgMedia] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNews() {
      setIsLoading(true)
      setFetchError(null)
      try {
        const { data: settingsData } = await supabase.from('site_settings').select('bg_news').limit(1).maybeSingle()
        if (settingsData && settingsData.bg_news) {
          setBgMedia(settingsData.bg_news)
        }

        const { data, error } = await supabase
          .from('news')
          .select('*')
          .eq('published', true)
          .order('published_at', { ascending: false })

        if (error) throw error

        if (data) {
          const mappedNews: NewsArticle[] = data.map(d => ({
            id: d.id,
            title: d.title,
            date: d.published_at,
            dateLabel: new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(d.published_at)),
            content: d.content,
            coverImage: d.cover_image ?? d.coverImage,
            published: d.published,
          }))
          setNews(mappedNews)
        }
      } catch (err: any) {
        console.error('Error fetching news:', err)
        setFetchError('Failed to load news articles: ' + err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchNews()
  }, [])

  const publishedNews = news

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      <SiteNav />

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden border-b border-border bg-navy-deep min-h-[300px] flex items-center pt-24">
        <MediaBackground url={bgMedia} overlayClassName="bg-navy-deep/70" />
        <div className="relative mx-auto max-w-6xl w-full px-5 py-16 sm:px-6 lg:px-8 lg:py-20 z-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium tracking-wide text-gold-soft">
              <CalendarDays className="size-3.5" />
              Latest Updates
            </span>
            <h1 className="mt-5 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              News &amp; <span className="text-gold">Announcements</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/70 sm:text-lg">
              Stay up-to-date with the latest results, announcements, and stories from the UIUJEF community.
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20 w-full">
        {isLoading ? (
          <div className="py-24 text-center">
            <p className="text-lg font-semibold text-navy animate-pulse">Loading news...</p>
          </div>
        ) : fetchError ? (
          <div className="py-24 text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-red-500/10 mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-lg font-bold text-red-500">{fetchError}</p>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">We encountered an issue while connecting to our database. Our team has been notified.</p>
          </div>
        ) : publishedNews.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-lg font-semibold text-navy">No news published yet.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {publishedNews.map((article) => (
              <article 
                key={article.id} 
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-[#F26522]/10 hover:border-[#F26522]/30 cursor-pointer"
                onClick={() => setActiveArticle(article)}
              >
                {article.coverImage && (
                  <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-3">
                    <CalendarDays className="size-3.5" />
                    {article.dateLabel}
                  </p>
                  <h3 className="font-serif text-xl font-bold leading-snug text-navy group-hover:text-[#F26522] transition-colors line-clamp-3">
                    {article.title}
                  </h3>
                  <div className="mt-5 flex items-center text-sm font-bold text-[#F26522] transition-colors mt-auto pt-4 border-t border-border/50">
                    Read Article
                    <ChevronRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />

      {/* ── News Article Modal ── */}
      {activeArticle && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={activeArticle.title}
        >
          <div
            className="absolute inset-0 bg-navy-deep/80 backdrop-blur-sm"
            onClick={() => setActiveArticle(null)}
          />
          <div className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Sticky Close Button in Fixed Container */}
            <button
              onClick={() => setActiveArticle(null)}
              className="absolute right-4 top-4 z-20 flex size-9 items-center justify-center rounded-full bg-black/5 text-navy/60 transition-colors hover:bg-black/10 hover:text-navy"
              aria-label="Close article"
            >
              ✕
            </button>
            
            {/* Scrollable Content */}
            <div className="overflow-y-auto overscroll-contain flex flex-col">
              {activeArticle.coverImage && (
                <div className="relative w-full h-48 sm:h-64 shrink-0">
                  <Image
                    src={activeArticle.coverImage}
                    alt={activeArticle.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </div>
              )}
              <div className="p-6 sm:p-10 flex flex-col">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/5 px-3 py-1 text-xs font-semibold text-navy/70 self-start mb-4">
                  <CalendarDays className="size-3.5" />
                  {activeArticle.dateLabel}
                </span>
                
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy mb-8 leading-snug">
                  {activeArticle.title}
                </h2>
                
                <div className="prose prose-navy max-w-none prose-p:text-navy/80 prose-headings:text-navy prose-strong:text-navy prose-li:text-navy/80">
                  {activeArticle.content.split('\n\n').map((paragraph, i) => {
                    if (paragraph.startsWith('- ')) {
                      return (
                        <ul key={i} className="list-disc pl-5 mb-4">
                          {paragraph.split('\n').map((item, j) => {
                            const text = item.replace(/^- /, '')
                            // Simple bold parsing for "Team Alpha" etc
                            const parts = text.split(/\*\*(.*?)\*\*/)
                            return (
                              <li key={j}>
                                {parts.map((part, k) => k % 2 === 1 ? <strong key={k}>{part}</strong> : part)}
                              </li>
                            )
                          })}
                        </ul>
                      )
                    }
                    return <p key={i} className="mb-4">{paragraph}</p>
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
