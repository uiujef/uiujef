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

  const handleDownloadPDF = async () => {
    if (result === 'not-found' || !result?.fullData) return;
    setIsDownloading(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // 1. Load UIUJEF Logo (from public folder)
      const img = new Image();
      img.src = '/logo.png';
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Continue even if logo fails
      });

      // 2. Colored Header (Navy Blue)
      doc.setFillColor(11, 17, 32); 
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      if (img.width) {
        const imgWidth = 55;
        const imgHeight = (img.height * imgWidth) / img.width;
        doc.addImage(img, 'PNG', pageWidth / 2 - (imgWidth / 2), 17.5 - (imgHeight / 2), imgWidth, imgHeight);
      }

      // Orange Accent Line
      doc.setFillColor(242, 101, 34); 
      doc.rect(0, 35, pageWidth, 2, 'F');

      // 3. Huge Transparent Watermark
      doc.setFontSize(85);
      doc.setTextColor(242, 101, 34);
      doc.setFont("helvetica", "bold");
      doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
      doc.text("APPROVED", pageWidth / 2, pageHeight / 2 + 10, { angle: 45, align: "center" });
      doc.setGState(new (doc as any).GState({ opacity: 1 }));

      // 4. Document Title
      doc.setTextColor(11, 17, 32);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Official Event Application Record", pageWidth / 2, 55, { align: "center" });

      // 5. Core Details Section
      let yPos = 75;
      const leftCol = 25;
      const rightCol = 70;

      const addRow = (label: string, value: any, isHighlight = false) => {
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

      const email = result.fullData.email || (result.fullData.team_members && result.fullData.team_members[0]?.email);
      const phone = result.fullData.phone || (result.fullData.team_members && result.fullData.team_members[0]?.phone);
      const studentId = result.fullData.student_id || (result.fullData.team_members && result.fullData.team_members[0]?.student_id);

      addRow("Application ID", result.fullData.application_id, true);
      addRow("Status", result.status, true);
      addRow("Applicant Name", result.name);
      if (email) addRow("Email Address", email);
      if (phone) addRow("Phone Number", phone);
      if (studentId) addRow("Student ID", studentId);

      // 6. Cleaned Additional Information
      if (result.fullData.custom_responses && Object.keys(result.fullData.custom_responses).length > 0) {
        const standardValues = [result.name, email, phone, studentId]
          .filter(Boolean)
          .map(v => String(v).toLowerCase().trim());
          
        const validData = Object.entries(result.fullData.custom_responses).filter(([key, value]) => {
          const strVal = String(value).toLowerCase().trim();
          return !standardValues.includes(strVal) && strVal !== "";
        });

        if (validData.length > 0) {
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
              doc.setFont("helvetica", "bold");
              doc.setTextColor(242, 101, 34);
              doc.text("•", leftCol, yPos);
              doc.setTextColor(30, 30, 30);
              doc.setFont("helvetica", "normal");
              const splitValue = doc.splitTextToSize(String(displayVal), pageWidth - 40);
              doc.text(splitValue, leftCol + 5, yPos);
              yPos += 8 * splitValue.length;
            } else {
              addRow(key, displayVal);
            }
          });
        }
      }

      // 7. Professional Footer
      doc.setDrawColor(200, 200, 200);
      doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
      
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "italic");
      doc.text("This is an electronically generated official document.", pageWidth / 2, pageHeight - 17, { align: "center" });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 12, { align: "center" });

      doc.save(`UIUJEF_Application_${result.fullData.application_id}.pdf`);
      toast.success("Official PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };



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
