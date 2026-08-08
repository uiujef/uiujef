/**
 * Events data layer — replace array with Supabase queries when ready.
 *
 * Supabase table: `events`
 *   id, title, date, description, image, category, isRegistrationOpen,
 *   registrationDeadline, isTeamBased, maxTeamMembers, requireTeamName,
 *   requireTeamIcon, requireUniversityID
 *
 * CRUD pattern:
 *   Read:   supabase.from('events').select('*').order('date', { ascending: false })
 *   Create: supabase.from('events').insert([payload])
 *   Update: supabase.from('events').update(patch).eq('id', id)
 *   Delete: supabase.from('events').delete().eq('id', id)
 */

// ─── Core Event Interface ─────────────────────────────────────────────────────

export interface Event {
  /** Unique identifier — use Supabase UUID in production */
  id: string
  title: string
  /** ISO date string, e.g. "2026-03-14" */
  date: string
  /** Human-readable formatted date for display */
  dateLabel: string
  description: string
  /** Cover image URL — Supabase Storage public URL in production */
  image: string
  category: 'Summit' | 'Workshop' | 'Competition' | 'Seminar' | 'Social' | 'Other'
  excerpt: string
  isRegistrationOpen: boolean
  /** Whether this event needs registration buttons shown at all */
  requiresRegistration?: boolean
  /** ISO deadline string — used for HeroEventBanner countdown */
  registrationDeadline?: string
  /** Registration form configuration */
  registration?: EventRegistrationConfig
  /** Optional extended information for the Learn More modal */
  extendedDetails?: {
    rules?: string[]
    notices?: string[]
    teamRequirements?: string[]
    registeredTeams?: {
      name: string
      status: 'approved' | 'pending' | 'rejected'
    }[]
  }
  isPinned?: boolean
  pinnedAt?: string | null
}

// ─── Dynamic Form Config ──────────────────────────────────────────────────────

export interface EventRegistrationConfig {
  /** If true, renders per-member input blocks */
  isTeamBased: boolean
  /** Max number of members per team (used when isTeamBased = true) */
  maxTeamMembers: number
  requireTeamName: boolean
  requireTeamIcon: boolean
  /** If true, each member must provide their university ID */
  requireUniversityID: boolean
  /** Custom extra fields appended after core fields */
  extraFields?: ExtraField[]
  /** If true, injects the payment block (bKash/Nagad & TrxID) before submit */
  requiresPayment?: boolean
}

export interface ExtraField {
  id: string
  label: string
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea'
  placeholder?: string
  required: boolean
  options?: string[] // for type='select'
}

// ─── Event Data ───────────────────────────────────────────────────────────────

export const events: Event[] = [
  {
    id: 'econthon-2026',
    title: 'Econthon 2026',
    date: '2026-09-20',
    dateLabel: 'September 20, 2026',
    description:
      'Econthon 2026 is the flagship hackathon of UIUJEF — a high-intensity 24-hour economics problem-solving competition where teams tackle real-world economic challenges using data, creativity, and policy thinking. Compete, collaborate, and make your mark in Bangladesh\'s most exciting student economics event.',
    image: '/images/event-summit.png',
    category: 'Competition',
    excerpt:
      'The flagship 24-hour economics hackathon. Form your team, solve real-world problems, and compete for the top spot.',
    isRegistrationOpen: true,
    requiresRegistration: true,
    registrationDeadline: '2026-09-10T23:59:59',
    registration: {
      isTeamBased: true,
      maxTeamMembers: 4,
      requireTeamName: true,
      requireTeamIcon: false,
      requireUniversityID: true,
      requiresPayment: true,
    },
    extendedDetails: {
      rules: [
        "Participants must be currently enrolled undergraduate students.",
        "Plagiarism in policy briefs will result in immediate disqualification.",
        "Teams must bring their own laptops and data tools.",
      ],
      notices: [
        "Registration fee is BDT 500 per team.",
        "Food and accommodation will be provided during the 24-hour hackathon.",
        "Please complete payment before submitting this form.",
      ],
      teamRequirements: [
        "Minimum 2 members, maximum 4 members per team.",
        "Cross-university teams are allowed but must be stated clearly.",
      ],
      registeredTeams: [
        { name: "Team Alpha", status: "approved" },
        { name: "The Keynesians", status: "approved" },
        { name: "Beta Innovators", status: "pending" },
        { name: "Delta Force", status: "rejected" },
      ]
    }
  },
  {
    id: 'summit-2026',
    title: 'National Economics Summit 2026',
    date: '2026-03-14',
    dateLabel: 'March 14, 2026',
    description:
      'Two days of keynotes, panels, and workshops on inflation, trade policy, and the future of the Bangladeshi economy. Featuring economists from academia, government, and the private sector.',
    image: '/images/event-summit.png',
    category: 'Summit',
    excerpt:
      'Two days of keynotes and panels on inflation, trade, and the future of the Bangladeshi economy.',
    isRegistrationOpen: false,
    requiresRegistration: false,
    registration: {
      isTeamBased: false,
      maxTeamMembers: 1,
      requireTeamName: false,
      requireTeamIcon: false,
      requireUniversityID: true,
    },
  },
  {
    id: 'policy-lab-2026',
    title: 'Policy Lab: Data for Development',
    date: '2026-02-02',
    dateLabel: 'February 2, 2026',
    description:
      'A hands-on 3-hour workshop on econometrics tooling, dataset sourcing, and writing a publishable policy brief. Participants will use real datasets to simulate policy recommendations.',
    image: '/images/event-workshop.png',
    category: 'Workshop',
    excerpt:
      'Hands-on session on econometrics, dataset sourcing, and writing a publishable policy brief.',
    isRegistrationOpen: false,
    requiresRegistration: true,
    registration: {
      isTeamBased: false,
      maxTeamMembers: 1,
      requireTeamName: false,
      requireTeamIcon: false,
      requireUniversityID: true,
    },
  },
  {
    id: 'debate-cup-2026',
    title: 'Inter-University Debate Cup',
    date: '2026-01-18',
    dateLabel: 'January 18, 2026',
    description:
      'Sixteen university teams argued monetary policy before a panel of faculty judges and industry guests. The cup recognizes the best speakers in economic argumentation and counter-policy analysis.',
    image: '/images/event-debate.png',
    category: 'Competition',
    excerpt:
      'Sixteen teams argued monetary policy before a panel of faculty judges and industry guests.',
    isRegistrationOpen: false,
    requiresRegistration: true,
    registration: {
      isTeamBased: true,
      maxTeamMembers: 3,
      requireTeamName: true,
      requireTeamIcon: false,
      requireUniversityID: true,
    },
  },
  {
    id: 'career-seminar-2025',
    title: 'Career Pathways in Economics',
    date: '2025-11-05',
    dateLabel: 'November 5, 2025',
    description:
      'A career guidance seminar featuring speakers from the central bank, IMF, BRAC, and top consultancy firms. Students received advice on career progression, internship hunting, and international graduate admissions.',
    image: '/images/event-workshop.png',
    category: 'Seminar',
    excerpt:
      'Speakers from the central bank, IMF, BRAC, and consultancy firms shared career guidance with aspiring economists.',
    isRegistrationOpen: false,
    requiresRegistration: false,
    registration: {
      isTeamBased: false,
      maxTeamMembers: 1,
      requireTeamName: false,
      requireTeamIcon: false,
      requireUniversityID: false,
    },
  },
]

/** Returns the 3 most recent events (by date descending) for homepage display */
export function getLatestEvents(count = 3): Event[] {
  return [...events]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count)
}

/** Returns the active registration event (first with isRegistrationOpen = true) */
export function getActiveRegistrationEvent(): Event | null {
  return events.find((e) => e.isRegistrationOpen) ?? null
}
