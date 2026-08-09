'use client'

import { useState, useEffect } from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { FacebookIcon, InstagramIcon, LinkedinIcon } from '@/components/brand-icons'
import { contact, org, socials } from '@/lib/site-data'
import { SectionHeader } from '@/components/ui/section-header'

const socialIcons = {
  linkedin: LinkedinIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
}

export function ContactSection() {
  const [contactPhone, setContactPhone] = useState("01757855806")

  useEffect(() => {
    async function fetchContactNumber() {
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
      } catch (error) {
        console.error('Error fetching dynamic contact number:', error)
      }
    }
    fetchContactNumber()
  }, [])

  return (
    <section id="contact" className="bg-background">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <SectionHeader subtitle="Get in touch" title={`Contact ${org.shortName}`} />
          <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
            Have a question about membership, events, or partnerships? Reach out — we&apos;d love to
            hear from you.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href={`tel:${contactPhone.replace(/\s/g, '')}`}
            className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-lg hover:shadow-navy/5"
          >
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-navy text-gold">
              <Phone className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-navy">Phone</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground transition-colors group-hover:text-foreground">
              {contactPhone}
            </p>
          </a>

          <a
            href={`mailto:${contact.email}`}
            className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-lg hover:shadow-navy/5"
          >
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-navy text-gold">
              <Mail className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-navy">Email</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground transition-colors group-hover:text-foreground">
              {contact.email}
            </p>
          </a>

          <a
            href={contact.mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-lg hover:shadow-navy/5 sm:col-span-2 lg:col-span-1"
          >
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-navy text-gold">
              <MapPin className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-navy">Location</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground transition-colors group-hover:text-foreground">
              {contact.location}
            </p>
          </a>
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-secondary p-8 sm:p-10">
          <h2 className="font-serif text-xl font-bold text-navy">Follow us</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Stay updated on events, research highlights, and membership openings.
          </p>
          <ul className="mt-6 flex flex-wrap items-center gap-3">
            {socials.map((social) => {
              const Icon = socialIcons[social.icon]
              return (
                <li key={social.id}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors duration-200 hover:border-gold/50 hover:text-gold"
                  >
                    <Icon className="size-4" />
                    <span className="sr-only">{social.label}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
