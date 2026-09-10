'use client'

import { useState, useCallback, useId, useEffect } from 'react'
import { Users, User, Hash, Mail, ChevronRight, Loader2, CheckCircle2, X, Building2, Wallet, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { supabase } from '@/lib/supabase'
import type { EventRegistrationConfig } from '@/types'
import { cn } from '@/lib/utils'
import { telemetryStore } from '@/components/telemetry-provider'

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Supabase-ready payload for `event_registrations` table.
 * team_members is JSONB in Supabase.
 */
export interface EventRegistrationPayload {
  application_id: string
  event_id: string
  team_name: string | null
  members: MemberEntry[]
  payment_method?: string
  transaction_id?: string
  status: 'pending' | 'confirmed'
  submitted_at: string
}

interface MemberEntry {
  name: string
  father_name: string
  student_id: string
  email: string
  phone: string
  address: string
  university: string
}

const EMPTY_MEMBER: MemberEntry = { name: '', father_name: '', student_id: '', email: '', phone: '', address: '', university: '' }

// ─── Style tokens ─────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#F26522]/50 focus:outline-none focus:ring-1 focus:ring-[#F26522]/40 transition-colors duration-150'

// ─── Sub-components ──────────────────────────────────────────────────────────

function FieldLabel({
  htmlFor,
  icon: Icon,
  label,
}: {
  htmlFor: string
  icon: React.ElementType
  label: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50"
    >
      <Icon className="size-3.5 text-[#F26522]/70" />
      {label}
    </label>
  )
}

function MemberBlock({
  index,
  member,
  config,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number
  member: MemberEntry
  config: EventRegistrationConfig
  onChange: (index: number, field: keyof MemberEntry, value: string) => void
  onRemove: (index: number) => void
  canRemove: boolean
}) {
  const uid = useId()

  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/3 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-[#F26522]/15 text-xs font-bold text-[#F26522]">
            {index + 1}
          </div>
          <span className="text-sm font-semibold text-white/70">
            {index === 0 ? 'Team Leader (Member 1)' : `Member ${index + 1}`}
          </span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="flex size-7 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
            aria-label={`Remove member ${index + 1}`}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={`${uid}-name`} icon={User} label="Full Name" />
          <input
            required
            type="text"
            id={`${uid}-name`}
            value={member.name}
            onChange={(e) => onChange(index, 'name', e.target.value)}
            placeholder="e.g., Shaikh Jubair"
            className={inputCls}
          />
        </div>

        <div>
          <FieldLabel htmlFor={`${uid}-father`} icon={User} label="Father's Name" />
          <input
            required
            type="text"
            id={`${uid}-father`}
            value={member.father_name}
            onChange={(e) => onChange(index, 'father_name', e.target.value)}
            placeholder="e.g., Shaikh Jubair"
            className={inputCls}
          />
        </div>

        <div>
          <FieldLabel htmlFor={`${uid}-email`} icon={Mail} label="Email" />
          <input
            required
            type="email"
            id={`${uid}-email`}
            value={member.email}
            onChange={(e) => onChange(index, 'email', e.target.value)}
            placeholder="e.g., shaikh.jubair.2025@gmail.com"
            className={inputCls}
          />
        </div>

        <div>
          <FieldLabel htmlFor={`${uid}-phone`} icon={Hash} label="Phone Number" />
          <input
            required
            type="tel"
            id={`${uid}-phone`}
            value={member.phone}
            onChange={(e) => onChange(index, 'phone', e.target.value)}
            placeholder="e.g., 017XXXXXXXX"
            className={inputCls}
          />
        </div>

        {config.requireUniversityID && (
          <div>
            <FieldLabel htmlFor={`${uid}-sid`} icon={Hash} label="Student ID (Optional)" />
            <input
              type="text"
              id={`${uid}-sid`}
              value={member.student_id}
              onChange={(e) => onChange(index, 'student_id', e.target.value)}
              placeholder="e.g. 011231001"
              className={inputCls}
            />
          </div>
        )}

        <div>
          <FieldLabel htmlFor={`${uid}-address`} icon={Building2} label="Address" />
          <input
            required
            type="text"
            id={`${uid}-address`}
            value={member.address}
            onChange={(e) => onChange(index, 'address', e.target.value)}
            placeholder="Detailed Address"
            className={inputCls}
          />
        </div>

        <div>
          <FieldLabel htmlFor={`${uid}-uni`} icon={Building2} label={`University ${config.eventLevel === 'National' ? '(Required)' : ''}`} />
          <input
            required={config.eventLevel === 'National'}
            type="text"
            id={`${uid}-uni`}
            value={member.university}
            onChange={(e) => onChange(index, 'university', e.target.value)}
            placeholder="University name"
            className={inputCls}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface DynamicEventFormProps {
  eventId: string
  eventName: string
  eventDescription?: string
  appIdPrefix?: string
  config: EventRegistrationConfig
  registrationFee?: number
  onSuccess?: (payload: EventRegistrationPayload) => void
}

export function DynamicEventForm({
  eventId,
  eventName,
  eventDescription,
  appIdPrefix = 'EVENT',
  config,
  registrationFee,
  onSuccess,
}: DynamicEventFormProps) {
  const router = useRouter()
  const [teamName, setTeamName] = useState('')
  const [members, setMembers] = useState<MemberEntry[]>([{ ...EMPTY_MEMBER }])
  const [paymentMethod, setPaymentMethod] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [applicationId, setApplicationId] = useState('')
  const [paymentMethods, setPaymentMethods] = useState<{method: string, account_number: string, bank_name?: string}[]>([])
  const [customResponses, setCustomResponses] = useState<Record<string, any>>({})
  const [otherToggled, setOtherToggled] = useState<Record<string, boolean>>({})
  const [otherText, setOtherText] = useState<Record<string, string>>({})
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [verificationErrorMsg, setVerificationErrorMsg] = useState('')
  
  const [copiedId, setCopiedId] = useState(false)
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null)

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(true)
    toast.success('Application ID copied!')
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num)
    setCopiedNumber(num)
    toast.success('Number copied!')
    setTimeout(() => setCopiedNumber(null), 2000)
  }

  useEffect(() => {
    if (config.requiresPayment) {
      const loadPaymentMethods = async () => {
        try {
          const { data, error } = await supabase.from('site_settings').select('payment_methods').limit(1).maybeSingle()
          if (!error && data?.payment_methods) {
            setPaymentMethods(data.payment_methods)
          }
        } catch (err) {
          console.error('Failed to load payment methods', err)
        }
      }
      loadPaymentMethods()
    }
  }, [config.requiresPayment])

  // Update a specific member's field
  const handleMemberChange = useCallback(
    (index: number, field: keyof MemberEntry, value: string) => {
      setMembers((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], [field]: value }
        return next
      })
    },
    [],
  )

  const addMember = useCallback(() => {
    setMembers((prev) =>
      prev.length < (config.maxTeamMembers || 0) ? [...prev, { ...EMPTY_MEMBER }] : prev,
    )
  }, [config.maxTeamMembers])

  const removeMember = useCallback((index: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    let leadEmail = ''
    let leadName = 'Custom Application'
    let leadStudentId = ''
    
    if (config.is_custom_form && config.custom_form_fields && config.custom_form_fields.length > 0) {
      const emailField = config.custom_form_fields.find(f => f.type === 'email' || f.label.toLowerCase().includes('email'))
      if (emailField) {
        leadEmail = customResponses[emailField.id] || ''
      }
      
      const studentIdField = config.custom_form_fields.find(f => f.id === 'student_id' || f.label.toLowerCase().includes('student id'))
      if (studentIdField) {
        leadStudentId = customResponses[studentIdField.id] || ''
      }

      const nameField = config.custom_form_fields.find(f => f.label.toLowerCase().includes('name'))
      if (nameField) {
        leadName = customResponses[nameField.id] || 'Custom Application'
      }
    } else {
      leadEmail = members[0].email
      leadName = members[0].name
      leadStudentId = members[0].student_id
    }

    // On-Submit Membership Verification
    if (config.is_members_only) {
      const idOrEmailMatch = leadStudentId 
        ? `student_id.ilike.${leadStudentId},email.ilike.${leadEmail}` 
        : `email.ilike.${leadEmail}`
      
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('name')
        .or(idOrEmailMatch)
        .limit(1)

      if (memberError || !memberData || memberData.length === 0) {
        setVerificationErrorMsg("Your Name, Email, or Student ID does not match our official UIUJEF member records. Only verified members can register for this event.")
        setShowVerificationModal(true)
        setIsSubmitting(false)
        return
      }

      // Roughly verify the name matches (case-insensitive and fuzzy)
      const officialName = memberData[0].name.trim().toLowerCase()
      const providedName = leadName.trim().toLowerCase()
      
      const officialParts = officialName.split(/[\s.]+/)
      const providedParts = providedName.split(/[\s.]+/)
      
      const hasFuzzyMatch = 
        officialName.includes(providedName) || 
        providedName.includes(officialName) ||
        officialParts.some((part: string) => part.length >= 3 && providedName.includes(part)) ||
        providedParts.some((part: string) => part.length >= 3 && officialName.includes(part))

      if (!hasFuzzyMatch) {
        setVerificationErrorMsg("Your Name does not match the official member record for this ID/Email. Only verified members can register for this event.")
        setShowVerificationModal(true)
        setIsSubmitting(false)
        return
      }
    }

    // Fetch count of all event applications
    const { count, error: countError } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      
    if (countError) {
      console.error('[Event Registration Error]: Failed to fetch count', countError)
      toast.error('Failed to generate application ID. Please try again.')
      setIsSubmitting(false)
      return
    }
    
    const newId = `JEF-${appIdPrefix}-N${(count || 0) + 1}`
    setApplicationId(newId)

    const payload: EventRegistrationPayload = {
      application_id: newId,
      event_id: eventId,
      team_name: config.requireTeamName && !config.is_custom_form ? teamName : null,
      members: config.is_custom_form ? [] : (config.isTeamBased ? members : [members[0]]),
      payment_method: config.requiresPayment ? paymentMethod : undefined,
      transaction_id: config.requiresPayment ? transactionId : undefined,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    }

    try {
      // Process custom responses to include 'Other' text
      const processedCustomResponses = { ...customResponses }
      for (const field of config.custom_form_fields || []) {
        if (otherToggled[field.id] && otherText[field.id]) {
          if (field.allow_multiple) {
            processedCustomResponses[field.id] = [...(processedCustomResponses[field.id] || []), otherText[field.id]]
          } else {
            processedCustomResponses[field.id] = otherText[field.id]
          }
        }
      }

      // Supabase Insertion
      const finalMembers = config.is_custom_form ? null : (config.isTeamBased ? members : [members[0]])
      
      const { error: dbError } = await supabase
        .from('applications')
        .insert([
          {
            application_id: newId,
            name: leadName || 'Custom Application',
            email: leadEmail || null,
            student_id: leadStudentId || null,
            type: 'Event',
            status: 'Pending',
            team_members: finalMembers,
            transaction_id: config.requiresPayment ? transactionId : null,
            event_id: eventId,
            custom_responses: Object.keys(processedCustomResponses).length > 0 ? processedCustomResponses : null,
          }
        ])
        
      if (dbError) {
        throw dbError
      } else {
        console.log('[Supabase] Successfully inserted application record.')
        
        // Send email only after successful insert
        if (leadEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail.trim())) {
          try {
            const res = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: leadName,
                email: leadEmail,
                applicationId: newId,
              }),
            })
            
            if (!res.ok) {
              throw new Error('Failed to send email via API')
            }
            
            console.log(`[Resend] Sent confirmation email to ${leadEmail}. Application ID: ${newId}`)
          } catch (emailErr) {
            console.error('[Resend Error]:', emailErr)
            toast.error("Registration successful, but failed to send confirmation email.")
          }
        }
      }
    } catch (err: any) {
      console.error('[Event Registration Error]:', err, JSON.stringify(err, null, 2))
      setIsSubmitting(false)
      const errorMessage = err.message || JSON.stringify(err)
      toast.error(errorMessage)
      // Return early to prevent success screen on error
      return
    }

    await new Promise((r) => setTimeout(r, 1500))

    setIsSubmitting(false)
    setIsSuccess(true)
    // Note: Deliberately removed auto onSuccess call here so the modal stays open until user clicks Close
  }

  if (isSuccess) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-green-500/10 ring-2 ring-green-500/30">
          <CheckCircle2 className="size-10 text-green-500" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-white mb-2">Registration Submitted!</h3>
        <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-white/60">
          Your registration for <span className="font-semibold text-[#F26522]">{eventName}</span> has
          been received. You will get a confirmation once reviewed.
        </p>

        <div className="mb-8 rounded-2xl border border-[#F26522]/20 bg-[#F26522]/10 p-5 shadow-inner backdrop-blur-sm mx-auto max-w-xs">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#F26522]/80 mb-2">
            Application ID
          </p>
          <div className="group flex items-center justify-center gap-3">
            <div className="font-mono text-xl font-bold tracking-wider text-white">
              {applicationId}
            </div>
            <button
              onClick={() => handleCopyId(applicationId)}
              className="flex size-8 items-center justify-center rounded-full bg-white/5 text-white/50 transition-all hover:bg-white/10 hover:text-white"
              title="Copy ID"
            >
              {copiedId ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
            </button>
          </div>
          <div className="mt-4 flex flex-col items-start gap-2 text-left rounded-lg bg-red-500/10 p-4 border border-red-500/20">
            <div className="flex items-start gap-2">
              <span className="text-xl">⚠️</span>
              <p className="text-[12px] font-semibold text-red-200">
                Please copy and save your Application ID safely for future tracking. Do not close this window without saving it!
              </p>
            </div>
            <p className="text-[12px] font-medium text-white/80 mt-1 pl-7">
              Please check your email inbox to find your Application ID. If you don't see it, be sure to check your Spam or Junk folder.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => {
              if (onSuccess) {
                onSuccess({} as any)
              } else {
                router.push('/events')
              }
            }}
            className="w-full sm:w-auto rounded-full bg-[#F26522] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#F26522]/25 transition-all hover:bg-[#FF7A3D]"
          >
            Close & Finish
          </button>
        </div>
      </div>
    )
  }



  return (
    <>
      {showVerificationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0B1120]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full mx-auto text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-red-500/10 ring-2 ring-red-500/30">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-white mb-3">Membership Verification Failed</h3>
            <p className="mb-8 text-sm leading-relaxed text-white/70">
              {verificationErrorMsg}
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="/join"
                className="w-full inline-block rounded-full bg-[#F26522] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#F26522]/25 transition-all hover:bg-[#FF7A3D]"
              >
                Register as a Member First
              </a>
              <button
                type="button"
                onClick={() => setShowVerificationModal(false)}
                className="w-full rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        onFocusCapture={() => telemetryStore.startFocus(`Event Registration: ${eventName}`)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            telemetryStore.stopFocus()
          }
        }}
        className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur-xl"
      >
      <div className="space-y-6 p-6 sm:p-8">
        <div>
          <h3 className="font-serif text-xl font-bold text-white">{eventName}</h3>
          {eventDescription && (
            <p className="mt-2 text-sm text-white/70 whitespace-pre-wrap">{eventDescription}</p>
          )}
          <p className="mt-1 text-xs font-semibold text-white/50 uppercase tracking-wider">
            {config.isTeamBased
              ? `Team registration — up to ${config.maxTeamMembers} members`
              : 'Individual registration'}
          </p>
        </div>

        {/* Team Name */}
        {!config.is_custom_form && config.isTeamBased && config.requireTeamName && (
          <div>
            <FieldLabel htmlFor="team-name" icon={Users} label="Team Name" />
            <input
              required
              type="text"
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. The Keynesians"
              className={inputCls}
            />
          </div>
        )}

        {/* Member blocks */}
        {!config.is_custom_form && (
          <div className="space-y-4">
            {config.isTeamBased && (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                Team Members ({members.length}/{config.maxTeamMembers})
              </p>
            )}
            {(config.isTeamBased ? members : [members[0]]).map((member, i) => (
              <MemberBlock
                key={i}
                index={i}
                member={member}
                config={config}
                onChange={handleMemberChange}
                onRemove={removeMember}
                canRemove={!!config.isTeamBased && members.length > 1}
              />
            ))}
          </div>
        )}

        {/* Add member button */}
        {!config.is_custom_form && config.isTeamBased && members.length < (config.maxTeamMembers || 0) && (
          <button
            type="button"
            onClick={addMember}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-sm font-semibold text-white/50 transition-colors hover:border-[#F26522]/40 hover:text-[#F26522]"
          >
            + Add Member {members.length + 1}
          </button>
        )}

        {/* Custom Fields */}
        {config.custom_form_fields && config.custom_form_fields.length > 0 && (
          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Additional Information</p>
            <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-white/10 bg-white/3 p-5">
              {config.custom_form_fields.map((field) => (
                <div key={field.id} className="sm:col-span-2 lg:col-span-1 space-y-2">
                  <FieldLabel htmlFor={`custom-${field.id}`} icon={Hash} label={field.label} />
                  
                  {field.type === 'dropdown' || field.type === 'select' || field.type === 'radio' ? (
                    <div className="space-y-3">
                      {field.allow_multiple ? (
                        <div className="flex flex-col gap-2">
                          {field.options?.map((opt, idx) => (
                            <label key={idx} className="flex items-center gap-2 cursor-pointer text-sm text-white/80">
                              <input
                                type="checkbox"
                                name={`custom-${field.id}`}
                                value={opt}
                                checked={(customResponses[field.id] || []).includes(opt)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setCustomResponses(prev => {
                                    const current = prev[field.id] || [];
                                    const updated = checked ? [...current, opt] : current.filter((v: string) => v !== opt);
                                    return { ...prev, [field.id]: updated };
                                  });
                                }}
                                className="text-[#F26522] focus:ring-[#F26522] bg-white/10 border-white/20 rounded"
                              />
                              {opt}
                            </label>
                          ))}
                          {field.allow_other && (
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-white/80">
                              <input
                                type="checkbox"
                                name={`custom-${field.id}-other`}
                                checked={otherToggled[field.id] || false}
                                onChange={(e) => {
                                  setOtherToggled(prev => ({ ...prev, [field.id]: e.target.checked }));
                                }}
                                className="text-[#F26522] focus:ring-[#F26522] bg-white/10 border-white/20 rounded"
                              />
                              Other
                            </label>
                          )}
                        </div>
                      ) : field.type === 'radio' ? (
                        <div className="flex flex-col gap-2">
                          {field.options?.map((opt, idx) => (
                            <label key={idx} className="flex items-center gap-2 cursor-pointer text-sm text-white/80">
                              <input
                                type="radio"
                                name={`custom-${field.id}`}
                                required={field.required && !otherToggled[field.id] && !customResponses[field.id]}
                                value={opt}
                                checked={!otherToggled[field.id] && customResponses[field.id] === opt}
                                onChange={(e) => {
                                  setOtherToggled(prev => ({ ...prev, [field.id]: false }));
                                  setCustomResponses(prev => ({ ...prev, [field.id]: e.target.value }));
                                }}
                                className="text-[#F26522] focus:ring-[#F26522] bg-white/10 border-white/20"
                              />
                              {opt}
                            </label>
                          ))}
                          {field.allow_other && (
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-white/80">
                              <input
                                type="radio"
                                name={`custom-${field.id}`}
                                required={field.required && !otherToggled[field.id] && !customResponses[field.id]}
                                value="__other__"
                                checked={otherToggled[field.id] || false}
                                onChange={(e) => {
                                  setOtherToggled(prev => ({ ...prev, [field.id]: true }));
                                  setCustomResponses(prev => ({ ...prev, [field.id]: '' }));
                                }}
                                className="text-[#F26522] focus:ring-[#F26522] bg-white/10 border-white/20"
                              />
                              Other
                            </label>
                          )}
                        </div>
                      ) : (
                        <select
                          id={`custom-${field.id}`}
                          required={field.required && !otherToggled[field.id]}
                          value={otherToggled[field.id] ? '__other__' : (customResponses[field.id] || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__other__') {
                              setOtherToggled(prev => ({ ...prev, [field.id]: true }));
                              setCustomResponses(prev => ({ ...prev, [field.id]: '' }));
                            } else {
                              setOtherToggled(prev => ({ ...prev, [field.id]: false }));
                              setCustomResponses(prev => ({ ...prev, [field.id]: val }));
                            }
                          }}
                          className={cn(inputCls, 'bg-[#1B2A4A]/60')}
                        >
                          <option value="" disabled>Select {field.label}</option>
                          {field.options?.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                          {field.allow_other && <option value="__other__">Other</option>}
                        </select>
                      )}
                      
                      {otherToggled[field.id] && (
                        <input
                          type="text"
                          required={field.required}
                          value={otherText[field.id] || ''}
                          onChange={(e) => setOtherText(prev => ({ ...prev, [field.id]: e.target.value }))}
                          placeholder={`Please specify...`}
                          className={cn(inputCls, 'mt-2')}
                        />
                      )}
                    </div>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                      id={`custom-${field.id}`}
                      required={field.required}
                      value={customResponses[field.id] || ''}
                      onChange={(e) => setCustomResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                      placeholder={field.label}
                      className={inputCls}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Block */}
        {config.requiresPayment && (
          <div className="mt-8 rounded-2xl border border-[#F26522]/20 bg-[#F26522]/5 p-5">
            <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
              <Wallet className="size-4 text-[#F26522]" /> Payment Information
            </h4>
            {registrationFee ? (
              <p className="text-sm font-medium text-[#F26522] mb-4 bg-[#F26522]/10 p-3 rounded-xl">
                Required Fee: <span className="font-bold text-lg">৳{registrationFee}</span>
              </p>
            ) : null}

            {paymentMethods.length > 0 && (
              <div className="mb-6 rounded-xl border border-white/10 bg-[#1B2A4A]/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-3">
                  Please send the required fee to any of the following numbers:
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {paymentMethods.map((pm, idx) => (
                    <div key={idx} className="group flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 border border-white/5 hover:border-white/10 transition-colors">
                      <span className="text-sm font-semibold text-white/80">
                        {pm.method === 'Bank' && pm.bank_name ? `Bank (${pm.bank_name})` : pm.method}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[#F26522]">{pm.account_number}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyNumber(pm.account_number)}
                          className="flex size-7 items-center justify-center rounded-md text-white/40 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 hover:text-white"
                          title="Copy Number"
                        >
                          {copiedNumber === pm.account_number ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="payment_method" icon={Wallet} label="Method" />
                <select
                  id="payment_method"
                  required
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={cn(inputCls, 'bg-[#1B2A4A]/60')}
                >
                  <option value="" disabled>Select Method</option>
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((pm, idx) => {
                      const label = pm.method === 'Bank' && pm.bank_name ? `Bank (${pm.bank_name})` : pm.method;
                      return (
                        <option key={idx} value={label}>{label}</option>
                      )
                    })
                  ) : (
                    <>
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <FieldLabel htmlFor="transaction_id" icon={Hash} label="Transaction ID" />
                <input
                  type="text"
                  id="transaction_id"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="TrxID (e.g. 7F3B9V)"
                  className={cn(inputCls, 'font-mono uppercase')}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="border-t border-white/8 p-6 sm:px-8">
        <button
          disabled={isSubmitting}
          type="submit"
          className="group relative z-10 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F26522] py-4 text-base font-bold text-white shadow-lg shadow-[#F26522]/25 transition-all duration-200 hover:bg-[#FF7A3D] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Registering…
            </>
          ) : (
            <>
              Complete Registration
              <ChevronRight className="size-5 transition-transform duration-150 group-hover:translate-x-1" />
            </>
          )}
        </button>
      </div>
    </form>
    </>
  )
}
