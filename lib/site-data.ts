/**
 * SINGLE SOURCE OF TRUTH FOR ALL CONTENT
 * ---------------------------------------
 * Every section reads from this file. When you move to Supabase, replace each
 * exported constant with a query that returns the same shape, e.g.
 *
 *   export async function getEvents(): Promise<EventItem[]> {
 *     const { data } = await supabase.from('events').select('*').order('date')
 *     return data ?? []
 *   }
 *
 * The components stay untouched.
 */

export type Stat = { id: string; label: string; value: string }
export type TimelineItem = { id: string; year: string; title: string; description: string }
export type Benefit = {
  id: string
  icon: BenefitIcon
  title: string
  description: string
  bgImage: string
}
export type BenefitIcon = 'network' | 'research' | 'speaking' | 'career'
export type EventItem = {
  id: string
  title: string
  date: string
  category: string
  image: string
  excerpt: string
  href: string
}
export type SocialLink = { id: string; label: string; href: string; icon: 'linkedin' | 'facebook' | 'instagram' }
export type NavLink = { id: string; label: string; href: string }

export const org = {
  shortName: 'UIUJEF',
  name: "UIU Junior Economists' Forum",
  university: 'United International University',
  tagline: 'Together We Thrive, Together We Rise',
  subtext:
    'Empowering a diverse community of future leaders, innovators, and strategic thinkers at United International University.',
  ctaLabel: 'Join Us',
  ctaHref: '/join',
}

/**
 * Hero background media.
 * `videoSrc` is optional — leave it empty to render the static poster only.
 * Drop in an MP4 (self-hosted in /public or a CDN URL) and it will autoplay muted.
 */
export const heroMedia = {
  posterSrc: '/images/hero-campus.png',
  videoSrc: '',
}

export const navLinks: NavLink[] = [
  { id: 'about', label: 'About', href: '/about' },
  { id: 'why', label: 'Why Join', href: '/why-join' },
  { id: 'events', label: 'Events', href: '/events' },
  { id: 'news', label: 'News', href: '/news' },
  { id: 'gallery', label: 'Gallery', href: '/gallery' },
  { id: 'members', label: 'Members', href: '/members' },
  { id: 'applications', label: 'Track Application', href: '/applications' },
  { id: 'contact', label: 'Contact', href: '/contact' },
]

export const quickStats: Stat[] = [
  { id: 'founded', label: 'Founded', value: '2016' },
  { id: 'members', label: 'Members', value: '500+' },
  { id: 'events', label: 'Events Organized', value: '50+' },
  { id: 'alumni', label: 'Alumni Network', value: '200+' },
]

export const story = {
  eyebrow: 'Our Story',
  heading: 'A forum built by students, for the economists of tomorrow.',
  paragraphs: [
    "Founded in 2016 by a small circle of undergraduates who believed economics should be debated, not just memorized, UIUJEF has grown into one of the most active academic communities at United International University.",
    'Our mission is to bridge classroom theory and real-world policy — through research, competitions, and open dialogue. Our vision is a generation of Bangladeshi economists who think critically, communicate clearly, and lead with integrity.',
  ],
}

export const timeline: TimelineItem[] = [
  {
    id: '2016',
    year: '2016',
    title: 'The Beginning',
    description: 'Founded by a handful of economics undergraduates with a single reading circle.',
  },
  {
    id: '2018',
    year: '2018',
    title: 'First National Summit',
    description: 'Hosted our first inter-university economics summit with 12 participating campuses.',
  },
  {
    id: '2021',
    year: '2021',
    title: 'Going Digital',
    description: 'Launched virtual policy labs and our research publication during the pandemic.',
  },
  {
    id: '2024',
    year: '2024',
    title: '500 Strong',
    description: 'Crossed 500 active members and formalized our alumni mentorship program.',
  },
  {
    id: 'present',
    year: 'Present',
    title: 'Looking Forward',
    description: 'Building a nationwide network of junior economists and research collaborations.',
  },
]

export const benefits: Benefit[] = [
  {
    id: 'network',
    icon: 'network',
    title: 'A Real Network',
    description: '500+ members and 200+ alumni across banking, development, and academia.',
    bgImage: '/network.jpg',
  },
  {
    id: 'research',
    icon: 'research',
    title: 'Research That Ships',
    description: 'Co-author papers and policy briefs with faculty mentorship and peer review.',
    bgImage: '/research.jpg',
  },
  {
    id: 'speaking',
    icon: 'speaking',
    title: 'Stage Time',
    description: 'Debate, present, and moderate at national summits and case competitions.',
    bgImage: '/stage.jpg',
  },
  {
    id: 'career',
    icon: 'career',
    title: 'Career Runway',
    description: 'Workshops, internship referrals, and one-on-one guidance from working economists.',
    bgImage: '/career.jpg',
  },
]

export const events: EventItem[] = [
  {
    id: 'summit-2026',
    title: 'National Economics Summit 2026',
    date: 'March 14, 2026',
    category: 'Summit',
    image: '/images/event-summit.png',
    excerpt:
      'Two days of keynotes and panels on inflation, trade, and the future of the Bangladeshi economy.',
    href: '/events',
  },
  {
    id: 'policy-lab',
    title: 'Policy Lab: Data for Development',
    date: 'February 2, 2026',
    category: 'Workshop',
    image: '/images/event-workshop.png',
    excerpt:
      'A hands-on session on econometrics tooling, dataset sourcing, and writing a publishable brief.',
    href: '/events',
  },
  {
    id: 'debate-cup',
    title: 'Inter-University Debate Cup',
    date: 'January 18, 2026',
    category: 'Competition',
    image: '/images/event-debate.png',
    excerpt:
      'Sixteen teams argued monetary policy before a panel of faculty judges and industry guests.',
    href: '/events',
  },
]

export const contact = {
  phone: '01703208163',
  email: 'uiujef7@gmail.com',
  location: 'United International University, Madani Ave, Badda, Dhaka 1212, Bangladesh',
  mapHref: 'https://maps.google.com/?q=United+International+University+Dhaka',
}

export const socials: SocialLink[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/jefuiu/',
    icon: 'linkedin',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://www.facebook.com/JEFUIU',
    icon: 'facebook',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/uiujef',
    icon: 'instagram',
  },
]

export const footerColumns: { id: string; title: string; links: NavLink[] }[] = [
  {
    id: 'about',
    title: 'About',
    links: [
      { id: 'story', label: 'Our Story', href: '/about' },
      { id: 'why', label: 'Why Join', href: '/why-join' },
      { id: 'alumni', label: 'Alumni', href: '/about' },
    ],
  },
  {
    id: 'quick',
    title: 'Quick Links',
    links: [
      { id: 'events', label: 'Events', href: '/events' },
      { id: 'gallery', label: 'Gallery', href: '/gallery' },
      { id: 'members', label: 'Members', href: '/members' },
      { id: 'contact', label: 'Contact', href: '/contact' },
    ],
  },
  {
    id: 'legal',
    title: 'Legal',
    links: [
      { id: 'privacy', label: 'Privacy Policy', href: '/privacy' },
      { id: 'terms', label: 'Terms & Conditions', href: '/terms' },
    ],
  },
]

export const copyright = `© 2026 ${org.name} (${org.shortName}). All rights reserved.`
