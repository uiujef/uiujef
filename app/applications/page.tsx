'use client'

import { useState, useRef } from 'react'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import { Search, Loader2, CheckCircle2, Clock, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

import { supabase } from '@/lib/supabase'

type AppResult = { name: string, type: string, status: string, fullData?: any } | 'not-found'

export default function ApplicationsTrackingPage() {
  const [appId, setAppId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [result, setResult] = useState<AppResult | null>(null)
  
  const pdfRef = useRef<HTMLDivElement>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appId.trim()) return

    setIsLoading(true)
    setResult(null)

    const cleanId = appId.trim().replace(/—|–/g, '-')
    
    // First query applications table
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .neq('status', 'archived')
      .ilike('application_id', `%${cleanId}%`) // Re-added % for bulletproof fuzzy matching
      .limit(1)
      .maybeSingle()

    if (data && !error) {
      setResult({
        name: data.name || (data.team_members && data.team_members[0]?.name) || 'Applicant',
        type: data.type,
        status: data.status,
        fullData: data
      })
      setIsLoading(false)
      return
    }
    
    // Fallback: Check if it's already an approved member in the members table
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('*')
      .neq('status', 'archived')
      .ilike('application_id', `%${cleanId}%`)
      .limit(1)
      .maybeSingle()
      
    if (memberData && !memberError) {
      setResult({
        name: memberData.name,
        type: 'Membership',
        status: 'Approved / Active Member',
        fullData: memberData
      })
    } else {
      setResult('not-found')
    }
    
    setIsLoading(false)
  }

  const handleDownloadPDF = async () => {
    if (!pdfRef.current || result === 'not-found' || !result?.fullData) return
    
    setIsDownloading(true)
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`UIUJEF_Application_${result.fullData.application_id}.pdf`)
      toast.success('PDF Downloaded successfully!')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const renderCustomResponses = (responses: any) => {
    if (!responses || Object.keys(responses).length === 0) return null
    return Object.entries(responses).map(([key, val]: any) => (
      <div key={key} className="mb-2">
        <div className="font-bold text-gray-700 text-[14px]">{key}</div>
        <div className="text-gray-900 text-[14px]">{Array.isArray(val) ? val.join(', ') : String(val)}</div>
      </div>
    ))
  }

  return (
    <div className="relative min-h-screen bg-navy-deep flex flex-col">
      <SiteNav />

      <main className="flex-1 flex flex-col items-center justify-center p-4 py-24 sm:py-32">
        <div className="w-full max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
              Track Your <span className="text-[#F26522]">Application</span>
            </h1>
            <p className="text-white/70">
              Enter the tracking ID (e.g., JEF-MB-XXXXXX or JEF-EV-XXXXXX) you received during registration to view your current status.
            </p>
          </div>

          {/* Search Card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <Search className="absolute left-4 size-5 text-white/40" />
              <input
                type="text"
                placeholder="Enter Application ID"
                value={appId}
                onChange={(e) => setAppId(e.target.value.toUpperCase())}
                className="w-full rounded-full border border-white/10 bg-white/5 pl-12 pr-32 py-4 text-white placeholder:text-white/30 focus:border-[#F26522]/50 focus:outline-none focus:ring-1 focus:ring-[#F26522]/40 transition-colors font-mono tracking-wider uppercase"
                required
              />
              <button
                type="submit"
                disabled={isLoading || !appId.trim()}
                className="absolute right-2 top-2 bottom-2 rounded-full bg-[#F26522] px-6 text-sm font-bold text-white transition-all hover:bg-[#F26522]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Check Status'}
              </button>
            </form>

            {/* Results Area */}
            {result && (
              <div className="mt-8 pt-8 border-t border-white/10 transition-all duration-500 ease-in-out">
                {result === 'not-found' && (
                  <div className="text-center p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 font-medium">Application Not Found</p>
                    <p className="text-sm text-red-400/70 mt-1">Please double-check your ID format (e.g., JEF-MB-XXXXXX) and try again.</p>
                  </div>
                )}

                {result !== 'not-found' && result !== null && (
                  <div className={cn(
                    "flex flex-col sm:flex-row items-center justify-between gap-5 p-6 rounded-2xl text-left border",
                    result.status === 'Approved' ? "bg-green-500/10 border-green-500/30" :
                    result.status === 'Rejected' ? "bg-red-500/10 border-red-500/30" :
                    "bg-[#F26522]/10 border-[#F26522]/30"
                  )}>
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "size-14 rounded-full flex items-center justify-center shrink-0",
                        result.status.includes('Approved') ? "bg-green-500/20" :
                        result.status === 'Rejected' ? "bg-red-500/20" :
                        "bg-[#F26522]/20"
                      )}>
                        {result.status.includes('Approved') ? <CheckCircle2 className="size-6 text-green-500" /> : <Clock className={cn("size-6", result.status === 'Rejected' ? "text-red-500" : "text-[#F26522]")} />}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {result.type} Application: {result.status}
                        </h3>
                        <p className="text-sm text-white/70 mt-1">
                          <span className="font-semibold text-white">Applicant:</span> {result.name}<br/>
                          {result.status.includes('Approved') ? "Congratulations! Check your email for further instructions or welcome to the club!" :
                           result.status === 'Rejected' ? "Unfortunately, your application was not approved at this time." :
                           "Your application is currently under review. You will receive an email once a decision is made."}
                        </p>
                      </div>
                    </div>
                    {/* Download Button */}
                    {result.status === 'Approved' && result.type === 'Event' && (
                      <button
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                        className="shrink-0 flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/40 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                        Download Copy
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />

      {/* Hidden PDF Template */}
      {result !== 'not-found' && result !== null && result.fullData && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
          <div ref={pdfRef} style={{ width: '800px', backgroundColor: '#ffffff', padding: '40px', position: 'relative', fontFamily: 'sans-serif' }}>
            {/* Watermark */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-45deg)',
              fontSize: '100px',
              fontWeight: 'bold',
              color: '#F26522',
              opacity: 0.05,
              whiteSpace: 'nowrap',
              zIndex: 0
            }}>
              APPROVED
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px' }}>
                {/* Fallback empty alt for generated PDF */}
                <img src="/logo.png" alt="UIUJEF" style={{ height: '50px', marginBottom: '15px' }} />
                <h1 style={{ margin: '0', color: '#0f172a', fontSize: '24px' }}>Official Event Application Record</h1>
                <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px' }}>United International University Junior Economists' Forum</p>
              </div>

              {/* Body Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Application ID</div>
                  <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>{result.fullData.application_id}</div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Application Date</div>
                  <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>{new Date(result.fullData.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Applicant Name</div>
                  <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>{result.fullData.name || (result.fullData.team_members && result.fullData.team_members[0]?.name)}</div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Email Address</div>
                  <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>{result.fullData.email || (result.fullData.team_members && result.fullData.team_members[0]?.email)}</div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Phone Number</div>
                  <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>{result.fullData.phone || (result.fullData.team_members && result.fullData.team_members[0]?.phone)}</div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Student ID</div>
                  <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>{result.fullData.student_id || (result.fullData.team_members && result.fullData.team_members[0]?.student_id) || 'N/A'}</div>
                </div>
              </div>

              {/* Custom Responses */}
              {result.fullData.custom_responses && Object.keys(result.fullData.custom_responses).length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '16px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>Additional Information</h3>
                  {renderCustomResponses(result.fullData.custom_responses)}
                </div>
              )}

              {/* Team Members */}
              {result.fullData.team_members && result.fullData.team_members.length > 1 && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '16px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>Team Members</h3>
                  {result.fullData.team_members.map((member: any, i: number) => (
                    <div key={i} style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{member.name}</span>
                      <span style={{ color: '#64748b', marginLeft: '10px' }}>ID: {member.student_id} | Email: {member.email}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div style={{ marginTop: '50px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <p style={{ margin: '0 0 4px' }}>This is an electronically generated official document by UIUJEF.</p>
                <p style={{ margin: '0' }}>Generated on: {new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
