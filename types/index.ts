export type Member = {
  id: string
  name: string
  role: string
  custom_role?: string
  image?: string
  image_url?: string
  bio?: string
  quote?: string
  current_job?: string
  past_role?: string
  facebook_url?: string
  instagram_url?: string
  linkedin_url?: string
  student_id?: string
  student_address?: string
  blood_group?: string
  email?: string
  phone?: string
  hobby?: string
  status?: string
  socials?: {
    linkedin?: string
    github?: string
    twitter?: string
  }
}

export type NewsArticle = {
  id: string
  title: string
  date: string // format: YYYY-MM-DD
  dateLabel?: string
  category?: string
  image?: string
  coverImage?: string
  excerpt?: string
  content: string
  published?: boolean
  status?: string
}

export type Event = {
  id: string
  title: string
  date: string // format: YYYY-MM-DD
  dateLabel?: string // optional friendly string, e.g. 'Oct 15, 2026'
  appIdPrefix?: string
  description: string
  image?: string
  category: string
  excerpt: string
  status?: string
  isRegistrationOpen?: boolean
  requiresRegistration?: boolean
  registrationDeadline?: string // e.g. '2026-09-01T23:59:59'
  isPinned?: boolean
  pinnedAt?: string
  registrationFee?: number
  requires_payment?: boolean
  requires_registration?: boolean
  is_registration_open?: boolean
  max_team_size?: number
  max_team_members?: number
  registration_fee?: number
  is_featured?: boolean
  is_pinned?: boolean
  is_priority?: boolean
  participation_type?: string
  is_team_based?: boolean
  require_team_name?: boolean
  require_team_icon?: boolean
  require_university_id?: boolean
  event_level?: string
  registration_deadline?: string
  is_members_only?: boolean
  is_custom_form?: boolean
  allow_multiple_registrations?: boolean
  app_id_prefix?: string
  custom_form_fields?: Array<any>
  registration?: {
    price?: number
    maxCapacity?: number
    currentRegistrations?: number
    isTeamBased?: boolean
    maxTeamMembers?: number
    requireTeamName?: boolean
    requireTeamIcon?: boolean
    requireUniversityID?: boolean
    requiresPayment?: boolean
    eventLevel?: string
    is_members_only?: boolean
    custom_form_fields?: Array<{
      id: string
      label: string
      type: 'text' | 'email' | 'number' | 'select' | 'dropdown'
      required: boolean
      options?: string[]
    }>
    formFields?: Array<{
      id: string
      label: string
      type: 'text' | 'email' | 'tel' | 'select' | 'radio'
      required: boolean
      options?: string[]
    }>
  }
  extendedDetails?: {
    venue?: string
    speaker?: string
    rules?: Array<string>
    teamRequirements?: Array<string>
    notices?: Array<string>
    registeredTeams?: Array<{
      teamName?: string
      name?: string
      leader: string
      status: string
    }>
    agenda?: Array<{
      time: string
      title: string
      description?: string
    }>
    sponsors?: Array<{
      name: string
      logo: string
    }>
  }
}

export type EventRegistrationConfig = {
  team_size?: number
  price?: number
  isTeamBased?: boolean
  maxTeamMembers?: number
  requireTeamName?: boolean
  requireTeamIcon?: boolean
  requireUniversityID?: boolean
  requiresPayment?: boolean
  eventLevel?: string
  is_members_only?: boolean
  is_custom_form?: boolean
  custom_form_fields?: Array<{
    id: string
    label: string
    type: 'text' | 'email' | 'number' | 'select' | 'dropdown' | 'radio'
    required: boolean
    options?: string[]
    allow_other?: boolean
    allow_multiple?: boolean
    raw_options?: string
  }>
  allowMultipleRegistrations?: boolean
}
