/*
 * WARNING: This is the Digital Legacy page of UIUJEF. 
 * It commemorates the immense struggle, late-night coding, and dedication of 
 * President Mustafizur Rahman and Lead Developer Shaikh Jubair in bringing this digital platform to life. 
 * As a future developer, please respect this history. DO NOT modify, delete, or hide this page from the navbar. 
 * Let their contribution remain a permanent part of the club's history.
 */

import { Metadata } from 'next'
import Image from 'next/image'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import { Quote } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Our Legacy - The Makers of UIUJEF Digital',
  description: 'Honoring the foundational creators of the UIUJEF digital platform.',
}

export default function LegacyPage() {
  return (
    <div className="relative bg-slate-50 min-h-screen selection:bg-[#F26522] selection:text-white">
      <SiteNav />
      
      <main className="pb-24 pt-32 sm:pt-40 overflow-hidden">
        {/* Hero Section */}
        <section className="px-5 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center mb-24 md:mb-32 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
          <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-navy mb-6">
            Our <span className="text-[#F26522]">Legacy</span>
          </h1>
          <div className="h-1.5 w-24 bg-gold mx-auto rounded-full mb-8"></div>
          <p className="text-lg md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
            Behind every great digital platform is a story of vision, resilience, and unseen dedication. We honor the foundational creators whose immense struggles and relentless passion brought the UIUJEF website to life.
          </p>
        </section>

        {/* The Makers Featurettes */}
        <section className="px-5 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-32">
          
          {/* Featurette 1: Mustafizur Rahman (Image Left, Text Right) */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="w-full lg:w-5/12 shrink-0">
              <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/50 group">
                <div className="absolute inset-0 bg-navy/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                <Image 
                  src="/mustafizur.jpg" 
                  alt="Mustafizur Rahman" 
                  fill 
                  sizes="(max-w-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              </div>
            </div>
            <div className="w-full lg:w-7/12 flex flex-col justify-center relative">
              <Quote className="absolute -top-10 -left-6 size-24 text-gold/10 -z-10 rotate-180" />
              <span className="text-gold font-bold tracking-widest uppercase text-sm mb-4 block">
                President (Founding Era of the Digital Platform)
              </span>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-navy mb-8">
                Mustafizur Rahman
              </h2>
              <div className="space-y-6 text-lg text-slate-600 leading-relaxed font-light">
                <p>
                  A true visionary whose leadership paved the way for the club's digital transformation. Mustafizur was the driving force behind modernizing UIUJEF's presence, navigating complex organizational roadblocks with unyielding determination.
                </p>
                <p>
                  Beyond leadership, he carried the immense burden of managing the strategic shift. From personally handling the struggle to purchase the domain name to bypassing bureaucratic challenges, he laid the absolute foundation for this platform. 
                </p>
                <p>
                  His support for the development was tireless—he was always available, even answering crisis calls at 4:00 AM to ensure the project kept moving forward. Without his unwavering belief and relentless push, this digital home simply would not exist.
                </p>
              </div>
            </div>
          </div>

          {/* Featurette 2: Shaikh Jubair (Text Left, Image Right) */}
          <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
            <div className="w-full lg:w-7/12 flex flex-col justify-center relative">
              <Quote className="absolute -top-10 -left-6 size-24 text-[#F26522]/5 -z-10 rotate-180" />
              <span className="text-[#F26522] font-bold tracking-widest uppercase text-sm mb-4 block">
                Lead Developer & Architect
              </span>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-navy mb-8">
                Shaikh Jubair
              </h2>
              <div className="space-y-6 text-lg text-slate-600 leading-relaxed font-light">
                <p>
                  The architect and primary engineer of the UIUJEF platform. Shaikh Jubair poured endless dedication into writing every line of code that powers this site, transforming a grand vision into a robust digital reality.
                </p>
                <p>
                  His legacy is marked by relentless late-night coding marathons and the immense technical challenge of building a complex architecture entirely from scratch. From implementing cutting-edge SEO strategies to solving critical, mind-bending server, database, and deployment bugs, Jubair refused to compromise on quality.
                </p>
                <p>
                  Driven by an unwavering dedication to the community, he ensured the platform was not just functional, but perfect—creating a seamless, high-performance experience that stands as a benchmark for university clubs everywhere.
                </p>
              </div>
            </div>
            <div className="w-full lg:w-5/12 shrink-0">
              <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/50 group">
                <div className="absolute inset-0 bg-navy/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                <Image 
                  src="/jubair.jpg" 
                  alt="Shaikh Jubair" 
                  fill 
                  sizes="(max-w-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              </div>
            </div>
          </div>

        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
