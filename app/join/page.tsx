'use client'

import React, { useState, useEffect, useReducer, useCallback, ChangeEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import emailjs from '@emailjs/browser'
import { supabase } from '@/lib/supabase'
import {
  CheckCircle2, ChevronRight, ChevronLeft, Clock, Loader2, Wallet, User, BookOpen,
  Mail, Phone, Droplet, Building2, Hash, Calendar, Camera, MessageSquare, Search,
  X, Star, ListChecks, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CountdownTimer } from '@/components/countdown-timer'

const MEMBERSHIP_FEE = 500

type PendingMemberPayload = {
  full_name: string
  student_id: string
  student_address: string
  email: string
  phone: string
  date_of_birth: string
  father_name: string
  mother_name: string
  blood_group: string
  department: string
  why_join: string
  expect_from_jef: string
  extracurricular: string
  interested_roles: string
  know_about_jef: string
  heard_about: string
  payment_method: string
  transaction_id: string
  photo_url: string | null
  status: 'pending'
  submitted_at: string
}

type StepAction = 
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_STEP'; payload: number }

function stepReducer(state: number, action: StepAction) {
  switch (action.type) {
    case 'NEXT_STEP':
      return Math.min(state + 1, 3)
    case 'PREV_STEP':
      return Math.max(state - 1, 1)
    case 'SET_STEP':
      return action.payload
    default:
      return state
  }
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="h-[1px] flex-grow bg-white/10" />
      <h3 className="text-sm font-semibold tracking-wider text-white/50 uppercase">{label}</h3>
      <div className="h-[1px] flex-grow bg-white/10" />
    </div>
  )
}

function Field({ id, label, icon: Icon, error, children }: { id: string, label: string, icon: any, error?: string, children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-white/80">
          <Icon className="w-4 h-4 text-white/50" />
          {label}
        </label>
        {error && (
          <span className="flex items-center gap-1 text-xs font-medium text-red-400">
            <X className="w-3 h-3" />
            {error}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#F26522]/50 focus:outline-none focus:ring-1 focus:ring-[#F26522]/40 transition-colors duration-150"
const selectClass = cn(inputClass, "bg-[#1B2A4A]/60 appearance-none")
const textareaClass = cn(inputClass, "resize-none")

export default function JoinPage() {
  const [isRecruitmentOpen, setIsRecruitmentOpen] = useState(false)
  const [recruitmentDeadline, setRecruitmentDeadline] = useState<string | null>(null)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  
  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('site_settings').select('is_recruitment_open, recruitment_end').limit(1).maybeSingle()
      if (data) {
        setIsRecruitmentOpen(data.is_recruitment_open || false)
        setRecruitmentDeadline(data.recruitment_end)
      }
      setIsLoadingSettings(false)
    }
    fetchSettings()
  }, [])

  const [step, dispatchStep] = useReducer(stepReducer, 1)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [form, setForm] = useState<PendingMemberPayload>({
    full_name: '',
    student_id: '',
    student_address: '',
    email: '',
    phone: '',
    date_of_birth: '',
    father_name: '',
    mother_name: '',
    blood_group: '',
    department: '',
    why_join: '',
    expect_from_jef: '',
    extracurricular: '',
    interested_roles: '',
    know_about_jef: '',
    heard_about: '',
    payment_method: '',
    transaction_id: '',
    photo_url: null,
    status: 'pending',
    submitted_at: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep1 = useCallback(() => {
    const newErrors: Record<string, string> = {}
    if (!form.full_name.trim()) newErrors.full_name = 'Required'
    if (!form.student_id.trim()) newErrors.student_id = 'Required'
    if (!form.student_address.trim()) newErrors.student_address = 'Required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Valid Email Required'
    if (!form.phone.trim() || !/^(?:\+88|88)?(01[3-9]\d{8})$/.test(form.phone)) newErrors.phone = 'Valid BD Phone Required'
    if (!form.date_of_birth) newErrors.date_of_birth = 'Required'
    if (!form.father_name.trim()) newErrors.father_name = 'Required'
    if (!form.mother_name.trim()) newErrors.mother_name = 'Required'
    if (!form.blood_group) newErrors.blood_group = 'Required'
    if (!form.department || form.department.length < 2 || form.department.length > 4) newErrors.department = '2-4 chars only'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form])

  const validateStep2 = useCallback(() => {
    const newErrors: Record<string, string> = {}
    if (form.why_join.length < 50) newErrors.why_join = 'Min 50 chars'
    if (form.expect_from_jef.length < 30) newErrors.expect_from_jef = 'Min 30 chars'
    if (form.interested_roles.length < 20) newErrors.interested_roles = 'Min 20 chars'
    if (form.know_about_jef.length < 30) newErrors.know_about_jef = 'Min 30 chars'
    if (!form.heard_about) newErrors.heard_about = 'Required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form])

  const validateStep3 = useCallback(() => {
    const newErrors: Record<string, string> = {}
    if (!form.payment_method) newErrors.payment_method = 'Required'
    if (form.transaction_id.length < 6) newErrors.transaction_id = 'Min 6 chars'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form])

  const handleNext = useCallback(() => {
    let isValid = false
    if (step === 1) isValid = validateStep1()
    else if (step === 2) isValid = validateStep2()

    if (isValid) {
      dispatchStep({ type: 'NEXT_STEP' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [step, validateStep1, validateStep2])

  const handlePrev = useCallback(() => {
    dispatchStep({ type: 'PREV_STEP' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'department') {
      const upper = value.toUpperCase()
      if (upper.length <= 4) {
        setForm(prev => ({ ...prev, [name]: upper }))
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }, [])

  const handlePhotoUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const objectUrl = URL.createObjectURL(file)
      setPhotoPreview(objectUrl)
      // In a real scenario, you would upload and get the URL here
      setForm(prev => ({ ...prev, photo_url: objectUrl }))
    }
  }, [])
  const [applicationId, setApplicationId] = useState<string>('')

  const handleSubmit = useCallback(async () => {
    if (validateStep3()) {
      setIsLoading(true)
      
      // Generate unique application ID
      const newId = 'JEF-MB-' + Math.random().toString(36).substring(2, 8).toUpperCase()
      setApplicationId(newId)

      // Mock API / DB submission delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      try {
        await emailjs.send(
          'service_uiujef',
          'templete_uiujef',
          {
            to_name: form.full_name,
            email: form.email,
            application_id: newId,
          },
          {
            publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
          }
        )
        console.log(`[EmailJS] Sent confirmation email to ${form.email}. Application ID: ${newId}`)
        
        // Supabase Insertion
        const { error: dbError } = await supabase
          .from('applications')
          .insert([
            {
              application_id: newId,
              name: form.full_name,
              email: form.email,
              type: 'Member',
              status: 'Pending',
              address: form.student_address
            }
          ])
          
        if (dbError) {
          console.error('[Supabase] Error inserting application:', dbError)
        } else {
          console.log('[Supabase] Successfully inserted application record.')
        }
      } catch (err) {
        console.error('[EmailJS] Error sending email:', err)
      }

      setIsLoading(false)
      setIsSubmitted(true)
    }
  }, [validateStep3, form.email, form.full_name])

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen bg-navy-deep flex items-center justify-center">
        <Loader2 className="size-10 animate-spin text-[#F26522]" />
      </div>
    )
  }

  if (!isRecruitmentOpen) {
    return (
      <div className="min-h-screen bg-navy-deep flex items-center justify-center p-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur-xl p-8 md:p-12 max-w-lg w-full text-center space-y-6">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-[#F26522]" />
          </div>
          <h2 className="text-3xl font-bold text-white">Recruitment Closed</h2>
          <p className="text-white/60 text-lg leading-relaxed">
            Thank you for your interest in joining JEF! We are currently not accepting new applications.
          </p>
          <div className="pt-4">
            <p className="text-sm text-white/40 mb-4">Stay tuned for future updates.</p>
            <button className="bg-[#F26522] text-white px-8 py-3 rounded-xl font-medium hover:bg-[#F26522]/90 transition">
              Follow our Social Media
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-navy-deep flex items-center justify-center p-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur-xl p-8 md:p-12 max-w-2xl w-full text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-2 border-[#F26522] rounded-full animate-ping opacity-50" />
            <div className="relative bg-[#F26522] rounded-full w-full h-full flex items-center justify-center shadow-lg shadow-[#F26522]/30">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="font-serif text-3xl font-bold text-white mb-2">Application Submitted!</h2>
          <p className="text-white/70 text-lg mb-8">
            Thank you for applying to UIUJEF. We're reviewing your application.
          </p>

          {/* Application ID Box */}
          <div className="mb-8 rounded-2xl border border-[#F26522]/20 bg-[#F26522]/10 p-6 shadow-inner backdrop-blur-sm mx-auto max-w-sm">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#F26522]/80 mb-2">
              Your Application ID
            </p>
            <div className="font-mono text-3xl font-bold tracking-wider text-white">
              {applicationId}
            </div>
            <p className="mt-3 text-sm text-white/50">
              Save this ID to track your application status. A confirmation email has been sent to {form.email}.
            </p>
          </div>

          <Link href="/applications" className="inline-block bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 rounded-xl transition-colors">
            Track Application Status
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-deep py-12 px-4 flex justify-center relative">
      <div className="max-w-3xl w-full flex flex-col gap-8">
        
        {/* Back to Home Button */}
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white transition-colors duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
        
        {recruitmentDeadline && isRecruitmentOpen && (
          <div className="mx-auto flex flex-col items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F26522]">Recruitment closes in</span>
            <CountdownTimer targetDate={recruitmentDeadline} onExpire={() => setIsRecruitmentOpen(false)} />
          </div>
        )}

        {/* Stepper */}
        <div className="flex items-center justify-center max-w-xl mx-auto w-full mb-4">
          {[1, 2, 3].map((num, i) => (
            <React.Fragment key={num}>
              <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                  step > num ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : 
                  step === num ? "bg-[#F26522] text-white shadow-lg shadow-[#F26522]/30 scale-110" : 
                  "bg-white/10 text-white/30"
                )}>
                  {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
                </div>
                <span className={cn(
                  "text-xs font-medium absolute mt-12",
                  step >= num ? "text-white/80" : "text-white/30"
                )}>
                  {num === 1 ? 'Personal' : num === 2 ? 'Story' : 'Payment'}
                </span>
              </div>
              {i < 2 && (
                <div className={cn(
                  "flex-grow h-1 mx-4 rounded-full transition-colors duration-300",
                  step > num ? "bg-green-500/50" : "bg-white/10"
                )} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur-xl overflow-hidden mt-6">
          <div className="p-6 md:p-8">
            
            {/* Step 1: Personal Info */}
            <div className={cn("space-y-6 transition-all duration-300", step === 1 ? "block opacity-100" : "hidden opacity-0")}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">Personal Information</h2>
                <p className="text-white/50 text-sm mt-1">Let's start with the basics.</p>
              </div>

              <div className="flex flex-col items-center mb-6">
                <div className="relative w-28 h-28 rounded-full border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center overflow-hidden hover:bg-white/10 transition-colors cursor-pointer group">
                  {photoPreview ? (
                    <Image src={photoPreview} alt="Preview" fill className="object-cover" unoptimized />
                  ) : (
                    <Camera className="w-8 h-8 text-white/30 group-hover:text-white/50 transition-colors" />
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <p className="text-xs text-white/40 mt-3">Upload Profile Photo</p>
              </div>

              <SectionTitle label="Identity" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field id="full_name" label="Full Name" icon={User} error={errors.full_name}>
                  <input id="full_name" name="full_name" type="text" value={form.full_name} onChange={handleChange} className={inputClass} placeholder="e.g., Shaikh Jubair" />
                </Field>
                <Field id="student_id" label="Student ID" icon={Hash} error={errors.student_id}>
                  <input id="student_id" name="student_id" type="text" value={form.student_id} onChange={handleChange} className={inputClass} placeholder="01123XXXX" />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <Field id="student_address" label="Student Address" icon={Building2} error={errors.student_address}>
                  <input id="student_address" name="student_address" type="text" value={form.student_address} onChange={handleChange} className={inputClass} placeholder="e.g., Block B, Bashundhara R/A" />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field id="email" label="UIU Email Address" icon={Mail} error={errors.email}>
                  <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="e.g., shaikhjubair@gmail.com" />
                </Field>
                <Field id="phone" label="Phone Number" icon={Phone} error={errors.phone}>
                  <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} className={inputClass} placeholder="01XXXXXXXXX" />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field id="date_of_birth" label="Date of Birth" icon={Calendar} error={errors.date_of_birth}>
                  <input id="date_of_birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} className={inputClass} />
                </Field>
                <Field id="blood_group" label="Blood Group" icon={Droplet} error={errors.blood_group}>
                  <select id="blood_group" name="blood_group" value={form.blood_group} onChange={handleChange} className={selectClass}>
                    <option value="" disabled>Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field id="father_name" label="Father's Name" icon={User} error={errors.father_name}>
                  <input id="father_name" name="father_name" type="text" value={form.father_name} onChange={handleChange} className={inputClass} placeholder="e.g., Shaikh Jubair" />
                </Field>
                <Field id="mother_name" label="Mother's Name" icon={User} error={errors.mother_name}>
                  <input id="mother_name" name="mother_name" type="text" value={form.mother_name} onChange={handleChange} className={inputClass} placeholder="e.g., Shaikh Jubair" />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field id="department" label="Department" icon={Building2} error={errors.department}>
                  <input 
                    id="department" 
                    name="department" 
                    type="text" 
                    value={form.department} 
                    onChange={handleChange} 
                    onBlur={(e) => {
                      if(e.target.value.length < 2 || e.target.value.length > 4) {
                        setErrors(prev => ({...prev, department: '2-4 chars only'}))
                      } else {
                        setErrors(prev => { const { department, ...rest } = prev; return rest })
                      }
                    }}
                    className={cn(inputClass, "uppercase")} 
                    placeholder="CSE, BBA, etc." 
                  />
                </Field>
              </div>
            </div>

            {/* Step 2: Your Story */}
            <div className={cn("space-y-6 transition-all duration-300", step === 2 ? "block opacity-100" : "hidden opacity-0")}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">Your Story</h2>
                <p className="text-white/50 text-sm mt-1">Tell us a bit more about yourself and your aspirations.</p>
              </div>

              <div className="space-y-6">
                <Field id="why_join" label="Why do you want to join JEF?" icon={MessageSquare} error={errors.why_join}>
                  <textarea id="why_join" name="why_join" rows={3} value={form.why_join} onChange={handleChange} className={textareaClass} placeholder="I want to join because..." />
                  <div className="text-right text-xs text-white/30">{form.why_join.length}/50 min chars</div>
                </Field>

                <Field id="expect_from_jef" label="What do you expect from JEF?" icon={Star} error={errors.expect_from_jef}>
                  <textarea id="expect_from_jef" name="expect_from_jef" rows={3} value={form.expect_from_jef} onChange={handleChange} className={textareaClass} placeholder="I expect to learn..." />
                  <div className="text-right text-xs text-white/30">{form.expect_from_jef.length}/30 min chars</div>
                </Field>

                <Field id="extracurricular" label="Extracurricular Activities (Optional)" icon={BookOpen}>
                  <textarea id="extracurricular" name="extracurricular" rows={2} value={form.extracurricular} onChange={handleChange} className={textareaClass} placeholder="Clubs, sports, volunteering..." />
                </Field>

                <Field id="interested_roles" label="Roles/Tasks you're interested in" icon={ListChecks} error={errors.interested_roles}>
                  <textarea id="interested_roles" name="interested_roles" rows={2} value={form.interested_roles} onChange={handleChange} className={textareaClass} placeholder="Design, organizing events, marketing..." />
                  <div className="text-right text-xs text-white/30">{form.interested_roles.length}/20 min chars</div>
                </Field>

                <Field id="know_about_jef" label="What do you know about JEF?" icon={Search} error={errors.know_about_jef}>
                  <textarea id="know_about_jef" name="know_about_jef" rows={2} value={form.know_about_jef} onChange={handleChange} className={textareaClass} placeholder="JEF is a forum that..." />
                  <div className="text-right text-xs text-white/30">{form.know_about_jef.length}/30 min chars</div>
                </Field>

                <Field id="heard_about" label="Where did you hear about us?" icon={Building2} error={errors.heard_about}>
                  <select id="heard_about" name="heard_about" value={form.heard_about} onChange={handleChange} className={selectClass}>
                    <option value="" disabled>Select an option</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Friend">Friend</option>
                    <option value="Notice Board">Notice Board</option>
                    <option value="Email">Email</option>
                    <option value="Existing Member">Existing Member</option>
                    <option value="Campus Event">Campus Event</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Step 3: Payment */}
            <div className={cn("space-y-6 transition-all duration-300", step === 3 ? "block opacity-100" : "hidden opacity-0")}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">Payment & Finalize</h2>
                <p className="text-white/50 text-sm mt-1">Complete your registration fee to submit.</p>
              </div>

              <div className="bg-gradient-to-br from-[#F26522]/20 to-[#F26522]/5 border border-[#F26522]/30 rounded-2xl p-6 text-center shadow-lg shadow-[#F26522]/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Wallet className="w-24 h-24" />
                </div>
                <p className="text-white/70 text-sm uppercase tracking-wider font-semibold mb-2">Membership Fee</p>
                <div className="text-5xl font-bold text-white mb-6">৳{MEMBERSHIP_FEE}</div>
                <div className="flex flex-col gap-2 items-center justify-center text-sm bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm max-w-sm mx-auto">
                  <p className="text-white/90 font-medium">Send money via bKash or Nagad</p>
                  <p className="text-xl font-mono text-[#F26522] tracking-wider mt-1">01703208163</p>
                  <p className="text-white/40 text-xs mt-1">(Personal)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
                <Field id="payment_method" label="Payment Method" icon={Wallet} error={errors.payment_method}>
                  <select id="payment_method" name="payment_method" value={form.payment_method} onChange={handleChange} className={selectClass}>
                    <option value="" disabled>Select Option</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                  </select>
                </Field>
                <Field id="transaction_id" label="Transaction ID" icon={Hash} error={errors.transaction_id}>
                  <input id="transaction_id" name="transaction_id" type="text" value={form.transaction_id} onChange={handleChange} className={cn(inputClass, "font-mono uppercase")} placeholder="TrxID (e.g. 7F3B9V)" />
                </Field>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
              <button 
                type="button" 
                onClick={handlePrev}
                disabled={step === 1 || isLoading}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors",
                  step === 1 ? "opacity-0 pointer-events-none" : "bg-white/5 text-white hover:bg-white/10"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              
              {step < 3 ? (
                <button 
                  type="button" 
                  onClick={handleNext}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium bg-[#F26522] text-white hover:bg-[#F26522]/90 transition-all shadow-lg shadow-[#F26522]/20 hover:shadow-[#F26522]/40"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium bg-green-600 text-white hover:bg-green-500 transition-all shadow-lg shadow-green-600/20 hover:shadow-green-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {isLoading ? 'Submitting...' : 'Submit Application & Payment'}
                </button>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
