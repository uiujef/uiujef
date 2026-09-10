'use client'

import { useState, useRef } from 'react'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import { Search, Loader2, CheckCircle2, Clock, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { jsPDF } from 'jspdf'

import { supabase } from '@/lib/supabase'

type AppResult = { name: string, type: string, status: string, fullData?: any } | 'not-found'

export default function ApplicationsTrackingPage() {
  const [appId, setAppId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [result, setResult] = useState<AppResult | null>(null)

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

  const handleDownloadPDF = () => {
    if (result === 'not-found' || !result?.fullData) return;
    setIsDownloading(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // 1. Watermark (Background)
      doc.setFontSize(65);
      doc.setTextColor(240, 245, 240); // Very light grey/green
      doc.text("APPROVED", pageWidth / 2, pageHeight / 2, { angle: 45, align: "center" });

      // 2. Header
      doc.setTextColor(11, 17, 32);
      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.text("UIUJEF", pageWidth / 2, 25, { align: "center" });

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text("Official Event Application Record", pageWidth / 2, 33, { align: "center" });

      doc.setDrawColor(242, 101, 34); // Brand Orange
      doc.setLineWidth(1);
      doc.line(20, 40, pageWidth - 20, 40);

      // 3. Body Content
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(12);
      let yPos = 55;
      const leftCol = 25;
      const rightCol = 70;

      const addRow = (label: string, value: any) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, leftCol, yPos);
        doc.setFont("helvetica", "normal");
        const splitValue = doc.splitTextToSize(String(value || 'N/A'), pageWidth - rightCol - 20);
        doc.text(splitValue, rightCol, yPos);
        yPos += 8 * splitValue.length;
      };

      const email = result.fullData.email || (result.fullData.team_members && result.fullData.team_members[0]?.email);
      const phone = result.fullData.phone || (result.fullData.team_members && result.fullData.team_members[0]?.phone);
      const studentId = result.fullData.student_id || (result.fullData.team_members && result.fullData.team_members[0]?.student_id);

      addRow("Application ID", result.fullData.application_id);
      addRow("Status", result.status);
      addRow("Applicant Name", result.name);
      if (email) addRow("Email Address", email);
      if (phone) addRow("Phone Number", phone);
      if (studentId) addRow("Student ID", studentId);

      // Map Custom Responses
      if (result.fullData.custom_responses && Object.keys(result.fullData.custom_responses).length > 0) {
        yPos += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Additional Information:", leftCol, yPos);
        yPos += 10;
        
        Object.entries(result.fullData.custom_responses).forEach(([key, value]) => {
          const displayVal = Array.isArray(value) ? value.join(', ') : value;
          addRow(key, displayVal);
        });
      }

      // 4. Footer
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("This is an electronically generated official document.", pageWidth / 2, pageHeight - 20, { align: "center" });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 15, { align: "center" });

      doc.save(`UIUJEF_Application_${result.fullData.application_id}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
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

    </div>
  )
}
