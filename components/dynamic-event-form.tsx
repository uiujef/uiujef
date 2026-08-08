'use client'

import { useState, useCallback, useId } from 'react'
import { Users, User, Hash, Mail, ChevronRight, Loader2, CheckCircle2, X, Building2, Wallet } from 'lucide-react'
import emailjs from '@emailjs/browser'
import { supabase } from '@/lib/supabase'
import type { EventRegistrationConfig } from '@/types'
import { cn } from '@/lib/utils'

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
          <span className="text-sm font-semibold text-white/70">Member {index + 1}</span>
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
            <FieldLabel htmlFor={`${uid}-sid`} icon={Hash} label="Student ID" />
            <input
              required
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
  config: EventRegistrationConfig
  registrationFee?: number
  onSuccess?: (payload: EventRegistrationPayload) => void
}

export function DynamicEventForm({
  eventId,
  eventName,
  config,
  registrationFee,
  onSuccess,
}: DynamicEventFormProps) {
  const [teamName, setTeamName] = useState('')
  const [members, setMembers] = useState<MemberEntry[]>([{ ...EMPTY_MEMBER }])
  const [paymentMethod, setPaymentMethod] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [applicationId, setApplicationId] = useState('')

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

    const newId = 'JEF-EV-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    setApplicationId(newId)

    const payload: EventRegistrationPayload = {
      application_id: newId,
      event_id: eventId,
      team_name: config.requireTeamName ? teamName : null,
      members: config.isTeamBased ? members : [members[0]],
      payment_method: config.requiresPayment ? paymentMethod : undefined,
      transaction_id: config.requiresPayment ? transactionId : undefined,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    }

    try {
      // Supabase Insertion
      const finalMembers = config.isTeamBased ? members : [members[0]]
      
      const { error: dbError } = await supabase
        .from('applications')
        .insert([
          {
            application_id: newId,
            name: members[0].name,
            email: members[0].email,
            type: `Event: ${eventName}`,
            status: 'Pending',
            team_members: finalMembers,
            transaction_id: config.requiresPayment ? transactionId : null,
          }
        ])
        
      if (dbError) {
        throw dbError
      } else {
        console.log('[Supabase] Successfully inserted application record.')
        
        // Send email only after successful insert
        await emailjs.send(
          process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
          process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
          {
            to_name: members[0].name,
            to_email: members[0].email,
            application_id: newId,
          },
          {
            publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
          }
        )
        console.log(`[EmailJS] Sent confirmation email to ${members[0].email}. Application ID: ${newId}`)
      }
    } catch (err) {
      console.error('[Event Registration Error]:', err)
      setIsSubmitting(false)
      // Return early to prevent success screen on error
      return
    }

    await new Promise((r) => setTimeout(r, 1500))

    setIsSubmitting(false)
    setIsSuccess(true)
    onSuccess?.(payload)
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
          <div className="font-mono text-xl font-bold tracking-wider text-white">
            {applicationId}
          </div>
          <div className="mt-4 flex items-start gap-2 text-left rounded-lg bg-red-500/10 p-3 border border-red-500/20">
            <span className="text-xl">⚠️</span>
            <p className="text-[11px] font-semibold text-red-200">
              Please copy and save your Application ID safely for future tracking. Do not close this window without saving it!
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => {
              navigator.clipboard.writeText(applicationId)
              alert('Application ID copied to clipboard!')
            }}
            className="w-full sm:w-auto rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Copy ID
          </button>
          
          <button
            onClick={() => {
              window.location.href = '/'
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
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur-xl"
    >
      <div className="space-y-6 p-6 sm:p-8">
        <div>
          <h3 className="font-serif text-xl font-bold text-white">{eventName}</h3>
          <p className="mt-1 text-sm text-white/50">
            {config.isTeamBased
              ? `Team registration — up to ${config.maxTeamMembers} members`
              : 'Individual registration'}
          </p>
        </div>

        {/* Team Name */}
        {config.isTeamBased && config.requireTeamName && (
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

        {/* Add member button */}
        {config.isTeamBased && members.length < (config.maxTeamMembers || 0) && (
          <button
            type="button"
            onClick={addMember}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-sm font-semibold text-white/50 transition-colors hover:border-[#F26522]/40 hover:text-[#F26522]"
          >
            + Add Member {members.length + 1}
          </button>
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
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
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
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#F26522] py-4 text-base font-bold text-white shadow-lg shadow-[#F26522]/25 transition-all duration-200 hover:bg-[#FF7A3D] disabled:cursor-not-allowed disabled:opacity-60"
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
  )
}
