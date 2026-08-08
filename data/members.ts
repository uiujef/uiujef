export type Member = {
  id: string
  name: string
  email: string
  phone: string
  blood_group: string
  role: string
  custom_role?: string | null
  past_role?: string | null
  current_job?: string | null
  facebook_url?: string | null
  instagram_url?: string | null
  linkedin_url?: string | null
  image_url: string
  quote: string
  student_id: string
  student_address: string
}
