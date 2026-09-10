'use client'

import { useState, useCallback, useId, useEffect } from 'react'
import { Users, User, Hash, Mail, ChevronRight, Loader2, CheckCircle2, X, Building2, Wallet, Copy, Check, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { jsPDF } from 'jspdf'

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
  const [showEmailConfirm, setShowEmailConfirm] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  
  const [isDownloading, setIsDownloading] = useState(false)
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

    // DUPLICATE REGISTRATION PREVENTION
    if (!config.allowMultipleRegistrations) {
      const { data: existingApps, error: existingErr } = await supabase
        .from('applications')
        .select('name, email, student_id, team_members, custom_responses')
        .eq('event_id', eventId);
        
      if (!existingErr && existingApps && existingApps.length > 0) {
        let isDuplicate = false;
        
        let leadPhone = '';
        if (config.is_custom_form && config.custom_form_fields && config.custom_form_fields.length > 0) {
          const phoneField = config.custom_form_fields.find(f => f.label.toLowerCase().includes('phone') || f.label.toLowerCase().includes('mobile'));
          if (phoneField) {
            leadPhone = customResponses[phoneField.id] || '';
          }
        } else {
          leadPhone = members[0].phone || '';
        }
        
        for (const app of existingApps) {
          const matchesName = Boolean(leadName && app.name?.toLowerCase().trim() === leadName.toLowerCase().trim());
          
          if (matchesName) {
            if (config.eventLevel === 'National') {
              let appPhone = '';
              if (app.custom_responses) {
                const phoneFieldId = config.custom_form_fields?.find(f => f.label.toLowerCase().includes('phone') || f.label.toLowerCase().includes('mobile'))?.id;
                if (phoneFieldId) {
                  appPhone = app.custom_responses[phoneFieldId] || '';
                }
              } else if (app.team_members && app.team_members.length > 0) {
                appPhone = app.team_members[0].phone || '';
              }
              
              const matchesEmail = Boolean(leadEmail && app.email?.toLowerCase().trim() === leadEmail.toLowerCase().trim());
              const matchesPhone = Boolean(appPhone && leadPhone && appPhone === leadPhone);
              
              if (matchesEmail || matchesPhone) {
                isDuplicate = true;
                break;
              }
            } else {
              const matchesEmail = Boolean(leadEmail && app.email?.toLowerCase().trim() === leadEmail.toLowerCase().trim());
              const matchesStudentId = Boolean(leadStudentId && app.student_id?.toLowerCase().trim() === leadStudentId.toLowerCase().trim());
              
              if (matchesEmail || matchesStudentId) {
                isDuplicate = true;
                break;
              }
            }
          }
        }
        
        if (isDuplicate) {
          toast.error("You have already registered for this event!")
          setIsSubmitting(false)
          return
        }
      }
    }

    setPendingEmail(leadEmail)
    setShowEmailConfirm(true)
    setIsSubmitting(false)
  }

  const executeFinalSubmission = async () => {
    setIsSubmitting(true)
    setShowEmailConfirm(false)

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

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const img = new Image();
      img.src = '/logo.png';
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      const addPageDesign = () => {
        doc.setFillColor(11, 17, 32); 
        doc.rect(0, 0, pageWidth, 35, 'F');
        if (img.width) {
          const imgWidth = 55;
          const imgHeight = (img.height * imgWidth) / img.width;
          doc.addImage(img, 'PNG', pageWidth / 2 - (imgWidth / 2), 17.5 - (imgHeight / 2), imgWidth, imgHeight);
        }
        doc.setFillColor(242, 101, 34); 
        doc.rect(0, 35, pageWidth, 2, 'F');

        doc.setFontSize(70);
        doc.setTextColor(242, 101, 34);
        doc.setFont("helvetica", "bold");
        doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
        doc.text("APPROVED", pageWidth / 2, pageHeight / 2 + 30, { angle: 45, align: "center" });
        doc.setGState(new (doc as any).GState({ opacity: 1 }));

        doc.setDrawColor(200, 200, 200);
        doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "italic");
        doc.text("This is an electronically generated official document.", pageWidth / 2, pageHeight - 17, { align: "center" });
        doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 12, { align: "center" });
      };

      let yPos = 55;
      const leftCol = 25;
      const rightCol = 70;

      const checkPageBreak = (neededHeight: number) => {
        if (yPos + neededHeight > pageHeight - 35) {
          doc.addPage();
          addPageDesign();
          yPos = 55;
        }
      };

      const addRow = (label: string, value: any, isHighlight = false) => {
        checkPageBreak(10);
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, leftCol, yPos);
        
        if (isHighlight) {
          doc.setTextColor(242, 101, 34);
          doc.setFont("helvetica", "bold");
        } else {
          doc.setTextColor(30, 30, 30);
          doc.setFont("helvetica", "normal");
        }
        
        const splitValue = doc.splitTextToSize(String(value || 'N/A'), pageWidth - rightCol - 20);
        doc.text(splitValue, rightCol, yPos);
        yPos += 8 * splitValue.length + 2;
      };

      addPageDesign();

      doc.setTextColor(11, 17, 32);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Official Event Application Record", pageWidth / 2, 48, { align: "center" });
      yPos = 60;

      addRow("Application ID", applicationId, true);
      addRow("Status", "Pending", true);
      
      const isTeam = config.isTeamBased
      
      if (isTeam && teamName) {
        addRow("Team Name", teamName, true);
      }

      let leadEmail = ''
      let leadName = 'Custom Application'
      let leadStudentId = ''
      let leadPhone = ''
      
      if (config.is_custom_form && config.custom_form_fields && config.custom_form_fields.length > 0) {
        const emailField = config.custom_form_fields.find(f => f.type === 'email' || f.label.toLowerCase().includes('email'))
        if (emailField) leadEmail = customResponses[emailField.id] || ''
        const studentIdField = config.custom_form_fields.find(f => f.id === 'student_id' || f.label.toLowerCase().includes('student id'))
        if (studentIdField) leadStudentId = customResponses[studentIdField.id] || ''
        const nameField = config.custom_form_fields.find(f => f.label.toLowerCase().includes('name'))
        if (nameField) leadName = customResponses[nameField.id] || 'Custom Application'
        const phoneField = config.custom_form_fields.find(f => f.type === 'tel' || f.label.toLowerCase().includes('phone'))
        if (phoneField) leadPhone = customResponses[phoneField.id] || ''
      } else {
        leadEmail = members[0].email
        leadName = members[0].name
        leadStudentId = members[0].student_id
        leadPhone = members[0].phone
      }

      if (!config.is_custom_form && isTeam && members.length > 0) {
        members.forEach((member, i) => {
          checkPageBreak(15);
          yPos += 4;
          doc.setFillColor(242, 101, 34);
          doc.rect(20, yPos - 4, 3, 6, 'F');
          doc.setFontSize(12);
          doc.setTextColor(11, 17, 32);
          doc.setFont("helvetica", "bold");
          doc.text(`Member ${i + 1} ${i === 0 ? '(Team Leader)' : ''}`, 26, yPos);
          yPos += 8;

          if (member.name) addRow("Name", member.name);
          if (member.father_name) addRow("Father's Name", member.father_name);
          if (member.email) addRow("Email Address", member.email);
          if (member.phone) addRow("Phone Number", member.phone);
          if (member.university) addRow("University", member.university);
          if (member.student_id) addRow("Student ID", member.student_id);
        });
      } else {
        addRow("Applicant Name", leadName);
        if (leadEmail) addRow("Email Address", leadEmail);
        if (leadPhone) addRow("Phone Number", leadPhone);
        if (leadStudentId) addRow("Student ID", leadStudentId);
      }

      if (config.is_custom_form && Object.keys(customResponses).length > 0) {
        const standardValues = [leadName, leadEmail, leadPhone, leadStudentId]
          .filter(Boolean).map(v => String(v).toLowerCase().trim());
          
        const validData = Object.entries(customResponses).filter(([key, value]) => {
          const strVal = String(value).toLowerCase().trim();
          return !standardValues.includes(strVal) && strVal !== "";
        });

        if (validData.length > 0) {
          checkPageBreak(20);
          yPos += 8;
          doc.setFillColor(245, 247, 250);
          doc.rect(20, yPos - 6, pageWidth - 40, 8, 'F');
          doc.setTextColor(11, 17, 32);
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Additional Information", 25, yPos);
          yPos += 10;
          
          validData.forEach(([key, value]) => {
            const displayVal = Array.isArray(value) ? value.join(', ') : value;
            const isRandomKey = /^[a-z0-9]{8,12}$/.test(key);
            
            if (isRandomKey) {
              checkPageBreak(10);
              doc.setFont("helvetica", "bold");
              doc.setTextColor(242, 101, 34);
              doc.text("•", leftCol, yPos);
              doc.setTextColor(30, 30, 30);
              doc.setFont("helvetica", "normal");
              const splitValue = doc.splitTextToSize(String(displayVal), pageWidth - 40);
              doc.text(splitValue, leftCol + 5, yPos);
              yPos += 8 * splitValue.length;
            } else {
              const field = config.custom_form_fields?.find(f => f.id === key);
              const label = field ? field.label : key;
              addRow(label, displayVal);
            }
          });
        }
      }

      doc.save(`UIUJEF_Application_${applicationId}.pdf`);
      toast.success("Official PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

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
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-green-500/20 px-6 py-2.5 text-sm font-bold text-green-400 border border-green-500/40 transition-all hover:bg-green-500/30 disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Download Application Copy
          </button>
          
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
      {showEmailConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0B1120]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full mx-auto text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-serif text-2xl font-bold text-white mb-3">Confirm Your Email</h3>
            <p className="mb-8 text-sm leading-relaxed text-white/70">
              Please confirm that we should send your Application ID to: <strong className="text-white">{pendingEmail}</strong>
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={executeFinalSubmission}
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#F26522] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#F26522]/25 transition-all hover:bg-[#FF7A3D] disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Confirm & Register'}
              </button>
              <button
                type="button"
                onClick={() => setShowEmailConfirm(false)}
                disabled={isSubmitting}
                className="w-full rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/10 disabled:opacity-50"
              >
                Edit Email
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
          
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <span className="text-xl leading-none">⚠️</span>
            <p className="text-sm font-medium leading-relaxed text-amber-200/90">
              <strong className="text-amber-400">Important:</strong> Please double-check your email address carefully. Your unique Application ID and further instructions will be sent there.
            </p>
          </div>

          <p className="mt-4 text-xs font-semibold text-white/50 uppercase tracking-wider">
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
