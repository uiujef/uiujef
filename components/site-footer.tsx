'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Mail, MapPin, Phone, X, Code2 } from 'lucide-react'
import { FacebookIcon, InstagramIcon, LinkedinIcon } from '@/components/brand-icons'
import { contact, copyright, footerColumns, org, socials } from '@/lib/site-data'
import { supabase } from '@/lib/supabase'

type Sponsor = {
  id: string
  name: string
  logo_url: string
  website_url?: string
}

const socialIcons = {
  linkedin: LinkedinIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
}

function SponsorLogo({ sponsor }: { sponsor: Sponsor }) {
  const [imgError, setImgError] = useState(false)
  
  const hasLogoUrl = sponsor.logo_url && sponsor.logo_url.trim() !== ''
  const hasWebsiteUrl = sponsor.website_url && sponsor.website_url.trim() !== ''
  
  let imgSrc = ''
  if (!imgError && hasLogoUrl) {
    imgSrc = sponsor.logo_url
  } else if (!imgError && hasWebsiteUrl) {
    try {
      const url = new URL(sponsor.website_url!)
      imgSrc = `https://s2.googleusercontent.com/s2/favicons?domain=${url.hostname}&sz=128`
    } catch {
      imgSrc = `https://s2.googleusercontent.com/s2/favicons?domain=${sponsor.website_url}&sz=128`
    }
  }

  const imageClass = "h-12 md:h-16 w-auto object-contain brightness-0 invert opacity-70 group-hover:opacity-100 transition-opacity"

  const renderContent = () => {
    if (imgSrc && !imgError) {
      return (
        <img 
          src={imgSrc} 
          alt={sponsor.name} 
          className={imageClass}
          onError={() => setImgError(true)} 
        />
      )
    }
    return (
      <div className="h-12 md:h-16 flex items-center justify-center">
        <span className="text-xl md:text-2xl font-serif font-bold tracking-wider opacity-70 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {sponsor.name}
        </span>
      </div>
    )
  }

  if (hasWebsiteUrl) {
    return (
      <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="block transition-transform duration-300 hover:scale-105">
        {renderContent()}
      </a>
    )
  }

  return (
    <div className="block">
      {renderContent()}
    </div>
  )
}

export function SiteFooter() {
  const pathname = usePathname()
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [contactPhone, setContactPhone] = useState("01757855806")
  const [showDeveloperModal, setShowDeveloperModal] = useState(false)
  const [devPhoto, setDevPhoto] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSponsors() {
      try {
        const { data, error } = await supabase.from('sponsors').select('*').order('created_at', { ascending: true })
        if (error) throw error
        if (data) setSponsors(data)
      } catch (err) {
        console.error('Error fetching sponsors:', err)
      }
    }

    async function fetchContactInfo() {
      try {
        const { data: settings } = await supabase.from('site_settings').select('official_contact_number').limit(1).maybeSingle()
        if (settings?.official_contact_number) {
          setContactPhone(settings.official_contact_number)
        } else {
          const { data: president } = await supabase.from('members').select('phone').eq('role', 'President').limit(1).maybeSingle()
          if (president?.phone) {
            setContactPhone(president.phone)
          }
        }
      } catch (err) {
        console.error('Error fetching contact info:', err)
      }
    }

    async function fetchDevPhoto() {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('image_url, photo_url')
          .eq('name', 'Shaikh Jubair')
          .or('email.eq.sjubair0112420017@bscse.uiu.ac.bd,email.eq.shaikh.jubair.2025@gmail.com,phone.eq.01863834824,phone.eq.+8809658058885')
          .limit(1)
          .maybeSingle();

        if (data) {
          setDevPhoto(data.image_url || data.photo_url || null);
        }
      } catch (err) {
        console.error("Failed to fetch developer photo:", err);
      }
    }

    fetchSponsors()
    fetchContactInfo()
    fetchDevPhoto()
  }, [])

  const showSponsors = pathname !== '/' && sponsors.length > 0

  return (
    <footer className="bg-navy-deep text-white">
      {showSponsors && (
        <div className="border-b border-white/10 bg-white/5 py-12">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 text-center">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gold mb-8">Our Official Sponsors</h3>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
              {sponsors.map((sponsor) => (
                <div key={sponsor.id} className="relative group">
                  <SponsorLogo sponsor={sponsor} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,0.8fr)]">
          {/* Brand + contact */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt={org.name}
                width={140}
                height={36}
                className="h-9 w-auto object-contain"
              />
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">{org.name}</p>

            <ul className="mt-6 space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${contactPhone.replace(/\s/g, '')}`}
                  className="flex items-start gap-3 text-white/70 transition-colors hover:text-[#F26522]"
                >
                  <Phone className="mt-0.5 size-4 shrink-0 text-[#F26522]" aria-hidden="true" />
                  {contactPhone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-start gap-3 text-white/70 transition-colors hover:text-[#F26522]"
                >
                  <Mail className="mt-0.5 size-4 shrink-0 text-[#F26522]" aria-hidden="true" />
                  {contact.email}
                </a>
              </li>
              <li>
                <a
                  href={contact.mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 leading-relaxed text-white/70 transition-colors hover:text-[#F26522]"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-[#F26522]" aria-hidden="true" />
                  {contact.location}
                </a>
              </li>
            </ul>

            <ul className="mt-6 flex items-center gap-3">
              {socials.map((social) => {
                const Icon = socialIcons[social.icon]
                return (
                  <li key={social.id}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors duration-200 hover:border-[#F26522]/50 hover:text-[#F26522]"
                    >
                      <Icon className="size-4" />
                      <span className="sr-only">{social.label}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Nav columns */}
          {footerColumns.map((col) => (
            <div key={col.id}>
              <h3 className="font-semibold text-white tracking-wide">{col.title}</h3>
              <ul className="mt-5 space-y-3 text-sm">
                {col.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      className="text-white/60 transition-colors hover:text-[#F26522]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/50">{copyright}</p>
          <button 
            onClick={() => setShowDeveloperModal(true)}
            className="flex items-center gap-2 text-xs text-white/50 hover:text-[#F26522] transition-colors"
          >
            <Code2 className="size-3" />
            Meet the Developer
          </button>
        </div>
      </div>

      {/* Developer Modal */}
      {showDeveloperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-deep/80 backdrop-blur-sm" onClick={() => setShowDeveloperModal(false)} />
          <div className="relative bg-white border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowDeveloperModal(false)} className="absolute top-4 right-4 p-2 bg-gray-100/50 text-gray-500 rounded-full hover:bg-gray-200 transition-colors z-10">
              <X className="size-5" />
            </button>
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#F26522] to-orange-400 p-1 mb-6 shadow-lg">
                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                  <img src={devPhoto || "/developer-photo.jpg"} alt="Shaikh Jubair" className="w-full h-full object-cover" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-navy mb-1">Shaikh Jubair</h3>
              <p className="text-[#F26522] font-semibold text-sm mb-4">Full Stack Developer & AI Enthusiast</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                Hi, I'm Shaikh Jubair. I specialize in modern web development, crafting seamless user experiences, and integrating AI solutions. Welcome to the UIUJEF platform!
              </p>
              <div className="flex flex-col w-full gap-3">
                <a href="https://shaikhjubair.me" target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-[#F26522] text-white font-bold rounded-xl hover:bg-[#F26522]/90 transition-all text-sm shadow-md">
                  Visit Developer Profile
                </a>
                <div className="flex justify-center gap-4 mt-2">
                  <a href="https://linkedin.com/in/shaikhjubair" target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-[#0077B5] transition-colors">
                    <socialIcons.linkedin className="size-6" />
                  </a>
                  <a href="https://github.com/shaikhjubair" target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                    <svg className="size-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}
