/*
 * WARNING: This is the Digital Legacy page of UIUJEF. 
 * It commemorates the immense struggle, late-night coding, and dedication of 
 * President Mustafizur Rahman and Lead Developer Shaikh Jubair in bringing this digital platform to life. 
 * As a future developer, please respect this history. DO NOT modify, delete, or hide this page from the navbar. 
 * Let their contribution remain a permanent part of the club's history.
 */

import { Metadata } from 'next'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Our Legacy - The Makers of UIUJEF Digital',
  description: 'Honoring the foundational creators of the UIUJEF digital platform.',
}

export default function LegacyPage() {
  return (
    <div className="relative bg-slate-50 min-h-screen selection:bg-[#F26522] selection:text-white">
      <SiteNav />
      
      <main className="pb-24 pt-32 sm:pt-40">
        {/* Hero Section */}
        <section className="px-5 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center mb-24">
          <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-navy mb-6">
            The <span className="text-[#F26522]">Makers</span>
          </h1>
          <div className="h-1.5 w-24 bg-gold mx-auto rounded-full mb-8"></div>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            This digital platform stands as a testament to vision, resilience, and countless hours of unseen dedication. We honor the foundational creators who brought the UIUJEF website to life.
          </p>
        </section>

        {/* The Makers Timeline / Dual Cards */}
        <section className="px-5 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            
            {/* Mustafizur Rahman Card */}
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-gold transition-all duration-300 group-hover:w-2"></div>
              <div className="flex flex-col h-full">
                <span className="text-gold font-bold tracking-widest uppercase text-sm mb-2">President</span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy mb-6">
                  Mustafizur Rahman
                </h2>
                <div className="space-y-4 text-slate-600 leading-relaxed">
                  <p>
                    A true visionary whose leadership paved the way for the club's digital transformation. Mustafizur was the driving force behind modernizing UIUJEF's presence.
                  </p>
                  <p>
                    Beyond leadership, his immense struggle to secure the domain, manage critical resources, and coordinate the strategic shift laid the absolute foundation for this platform. Without his unwavering belief and relentless push through bureaucratic challenges, this digital home would not exist.
                  </p>
                </div>
              </div>
            </div>

            {/* Shaikh Jubair Card */}
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#F26522] transition-all duration-300 group-hover:w-2"></div>
              <div className="flex flex-col h-full">
                <span className="text-[#F26522] font-bold tracking-widest uppercase text-sm mb-2">Lead Developer</span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy mb-6">
                  Shaikh Jubair
                </h2>
                <div className="space-y-4 text-slate-600 leading-relaxed">
                  <p>
                    The architect and primary engineer of the UIUJEF platform. Shaikh Jubair poured endless dedication into writing every line of code that powers this site.
                  </p>
                  <p>
                    His legacy is marked by relentless late-night coding sessions, building a complex and robust architecture entirely from scratch. From implementing advanced SEO to solving critical server, database, and deployment challenges, Jubair's technical mastery keeps the site running perfectly for the entire community.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
