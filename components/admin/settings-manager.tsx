'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Phone, CalendarClock, RefreshCw, MonitorPlay, X, Wallet, UploadCloud, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/ui/confirm-modal'

function ToggleSwitch({ checked, onChange, disabled = false }: { checked: boolean, onChange: (c: boolean) => void, disabled?: boolean }) {
  return (
    <div 
      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${checked ? 'bg-[#F26522]' : 'bg-slate-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className="sr-only">Toggle</span>
      <span
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-300 ease-in-out ${checked ? 'translate-x-7' : 'translate-x-0'}`}
      />
    </div>
  )
}

export function SettingsManager() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  // Settings State
  const [isRecruitmentOpen, setIsRecruitmentOpen] = useState(false)
  const [isScheduleEnabled, setIsScheduleEnabled] = useState(false)
  const [recruitmentStart, setRecruitmentStart] = useState('')
  const [recruitmentEnd, setRecruitmentEnd] = useState('')
  const [officialContact, setOfficialContact] = useState('')
  const [membershipFee, setMembershipFee] = useState<number>(500)
  const [paymentMethods, setPaymentMethods] = useState<{method: string, account_number: string, bank_name?: string}[]>([])

  // Background Media State
  const [bgHome, setBgHome] = useState('')
  const [bgEvents, setBgEvents] = useState('')
  const [bgNews, setBgNews] = useState('')
  const [bgGallery, setBgGallery] = useState('')
  const [bgMembers, setBgMembers] = useState('')
  const [bgAboutHeader, setBgAboutHeader] = useState('')
  const [bgMission, setBgMission] = useState('')
  const [bgVision, setBgVision] = useState('')
  const [bgJourney1, setBgJourney1] = useState('')
  const [bgJourney2, setBgJourney2] = useState('')
  const [bgJourney3, setBgJourney3] = useState('')
  const [bgJourney4, setBgJourney4] = useState('')
  const [bgJourney5, setBgJourney5] = useState('')
  const [uploadingMedia, setUploadingMedia] = useState<{ [key: string]: boolean }>({})

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle()
      
      if (error) throw error
      
      if (data) {
        setSettingsId(data.id)
        setIsRecruitmentOpen(data.is_recruitment_open || false)
        
        if (data.recruitment_start) setRecruitmentStart(new Date(data.recruitment_start).toISOString().slice(0, 16))
        if (data.recruitment_end) setRecruitmentEnd(new Date(data.recruitment_end).toISOString().slice(0, 16))
        
        if (data.recruitment_start || data.recruitment_end) {
          setIsScheduleEnabled(true)
        }

        setOfficialContact(data.official_contact_number || '')
        setBgHome(data.bg_home || '')
        setBgEvents(data.bg_events || '')
        setBgNews(data.bg_news || '')
        setBgGallery(data.bg_gallery || '')
        setBgMembers(data.bg_members || '')
        setBgAboutHeader(data.bg_about_header || '')
        setBgMission(data.bg_mission || '')
        setBgVision(data.bg_vision || '')
        setBgJourney1(data.bg_journey_1 || '')
        setBgJourney2(data.bg_journey_2 || '')
        setBgJourney3(data.bg_journey_3 || '')
        setBgJourney4(data.bg_journey_4 || '')
        setBgJourney5(data.bg_journey_5 || '')
        if (data.membership_fee !== undefined) setMembershipFee(data.membership_fee)
        if (data.payment_methods) setPaymentMethods(data.payment_methods)
      }
    } catch (err: any) {
      toast.error('Database Error (Load Settings): ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSave = async () => {
    setIsConfirmOpen(false)
    setIsSaving(true)

    try {
      const payload = {
        is_recruitment_open: isRecruitmentOpen,
        recruitment_start: isScheduleEnabled && recruitmentStart ? new Date(recruitmentStart).toISOString() : null,
        recruitment_end: isScheduleEnabled && recruitmentEnd ? new Date(recruitmentEnd).toISOString() : null,
        official_contact_number: officialContact,
        bg_home: bgHome,
        bg_events: bgEvents,
        bg_news: bgNews,
        bg_gallery: bgGallery,
        bg_members: bgMembers,
        bg_about_header: bgAboutHeader,
        bg_mission: bgMission,
        bg_vision: bgVision,
        bg_journey_1: bgJourney1,
        bg_journey_2: bgJourney2,
        bg_journey_3: bgJourney3,
        bg_journey_4: bgJourney4,
        bg_journey_5: bgJourney5,
        membership_fee: membershipFee,
        payment_methods: paymentMethods,
      }

      console.log('Saving Settings Payload:', payload)

      if (settingsId) {
        const { error } = await supabase.from('site_settings').update(payload).eq('id', settingsId)
        if (error) throw new Error(error.message)
      } else {
        const { data, error } = await supabase.from('site_settings').insert([payload]).select().single()
        if (error) throw new Error(error.message)
        if (data) setSettingsId(data.id)
      }
      
      toast.success('Site settings saved successfully!')
    } catch (err: any) {
      console.error('Save Settings Error:', err)
      toast.error('Database Error (Save Settings): ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const syncPresidentNumber = async () => {
    setIsSyncing(true)
    try {
      const { data, error } = await supabase
        .from('members')
        .select('phone')
        .eq('role', 'President')
        .limit(1)
        .maybeSingle()

      if (error) throw error

      if (data && data.phone) {
        setOfficialContact(data.phone)
        toast.success("President's number fetched! Don't forget to save changes.")
      } else {
        toast.error("No President found with a valid phone number in the directory.")
      }
    } catch (err: any) {
      toast.error("Error fetching President's number: " + err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDirectUpload = async (file: File, prefix: string, key: string, setBg: (val: string) => void) => {
    setUploadingMedia(prev => ({ ...prev, [key]: true }))
    try {
      const ext = file.name.split('.').pop()
      const filename = `${prefix}_${Date.now()}.${ext}`
      const { data, error } = await supabase.storage.from('jef-images').upload(`settings/${filename}`, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('jef-images').getPublicUrl(data.path)
      
      setBg(publicUrl)
      toast.success('Media uploaded temporarily! Save settings to publish.')
    } catch (err: any) {
      toast.error('Failed to upload media: ' + err.message)
    } finally {
      setUploadingMedia(prev => ({ ...prev, [key]: false }))
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center animate-in fade-in duration-500">
        <Loader2 className="size-12 animate-spin text-[#F26522] mb-6 drop-shadow-md" />
        <p className="text-xl font-bold text-slate-800">Loading configurations...</p>
        <p className="text-sm text-slate-500 mt-2">Please wait while we fetch the latest settings.</p>
      </div>
    )
  }

  const renderMediaUpload = (label: string, key: string, prefix: string, state: string, setBg: (val: string) => void, accept = "image/*") => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-700">{label}</label>
        {state && !uploadingMedia[key] && (
          <button 
            type="button" 
            onClick={() => setBg('')} 
            className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline transition-colors flex items-center gap-1"
          >
            <X className="size-3" /> Remove
          </button>
        )}
      </div>
      
      <div className={`relative group w-full h-36 rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden flex flex-col items-center justify-center ${
        state ? 'border-transparent bg-slate-100' : 'border-slate-200 hover:border-[#F26522]/50 hover:bg-[#F26522]/5 bg-slate-50'
      }`}>
        {uploadingMedia[key] ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-6 animate-spin text-[#F26522]" />
            <span className="text-xs font-bold text-slate-600">Uploading media...</span>
          </div>
        ) : state ? (
          <>
            {state.endsWith('.mp4') || state.endsWith('.webm') ? (
              <video src={state} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted loop autoPlay playsInline />
            ) : (
              <img src={state} alt={label} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-wider uppercase flex items-center gap-2">
                <RefreshCw className="size-4" /> Change Media
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-[#F26522] transition-colors pointer-events-none">
            <UploadCloud className="size-8" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-bold">Click or drag to upload</span>
              <span className="text-xs font-medium text-slate-400">JPG, PNG, GIF or MP4</span>
            </div>
          </div>
        )}
        <input 
          type="file" 
          accept={accept}
          disabled={uploadingMedia[key]}
          onChange={e => {
            if (e.target.files && e.target.files.length > 0) {
              handleDirectUpload(e.target.files[0], prefix, key, setBg)
            }
          }} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Site Settings</h2>
        <p className="text-slate-500 mt-2 text-lg">Configure global platform settings, recruitments, and appearance.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setIsConfirmOpen(true); }} className="space-y-10">
        
        {/* Recruitment Timer Settings */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm border border-blue-100">
              <CalendarClock className="size-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Member Recruitment</h3>
              <p className="text-slate-500 mt-1">Control application visibility and scheduling.</p>
            </div>
          </div>
          
          <div className="p-8 space-y-10">
            {/* Master Toggle */}
            <div className="flex items-start justify-between gap-6 pb-8 border-b border-slate-100">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Recruitment is Open</h4>
                <p className="text-sm text-slate-500 mt-1 max-w-xl">When turned on, the recruitment form will be accessible to visitors. When off, the form is hidden completely regardless of the schedule.</p>
              </div>
              <ToggleSwitch checked={isRecruitmentOpen} onChange={setIsRecruitmentOpen} />
            </div>

            <div className={`transition-opacity duration-500 space-y-8 ${isRecruitmentOpen ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              {/* Schedule Toggle */}
              <div className="flex items-start justify-between gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div>
                  <h4 className="text-base font-bold text-slate-900">Enable Automatic Scheduling</h4>
                  <p className="text-sm text-slate-500 mt-1 max-w-xl">Automatically open and close recruitment based on specific start and end dates. If disabled, recruitment remains open indefinitely.</p>
                </div>
                <ToggleSwitch checked={isScheduleEnabled} onChange={setIsScheduleEnabled} disabled={!isRecruitmentOpen} />
              </div>

              {/* Date Pickers */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-all duration-500 overflow-hidden ${isScheduleEnabled ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 pointer-events-none !mt-0'}`}>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">Start Date & Time</label>
                  <input type="datetime-local" value={recruitmentStart} onChange={e => setRecruitmentStart(e.target.value)} disabled={!isRecruitmentOpen || !isScheduleEnabled} className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/10 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400 font-medium" />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">End Date & Time</label>
                  <input type="datetime-local" value={recruitmentEnd} onChange={e => setRecruitmentEnd(e.target.value)} disabled={!isRecruitmentOpen || !isScheduleEnabled} className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/10 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400 font-medium" />
                </div>
              </div>

              {/* Fee */}
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <label className="text-sm font-bold text-slate-700">Membership Fee (BDT)</label>
                <div className="relative max-w-md">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                  <input type="number" min="0" value={membershipFee} onChange={e => setMembershipFee(Number(e.target.value))} disabled={!isRecruitmentOpen} className="w-full pl-10 pr-5 py-4 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/10 outline-none transition-all disabled:bg-slate-50 font-bold text-slate-900" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Contact Info */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl shadow-sm border border-orange-100">
              <Phone className="size-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Official Contact</h3>
              <p className="text-slate-500 mt-1">The primary phone number shown globally.</p>
            </div>
          </div>

          <div className="p-8">
            <div className="max-w-2xl space-y-4">
              <label className="text-sm font-bold text-slate-700">Official Contact Number</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <input type="tel" value={officialContact} onChange={e => setOfficialContact(e.target.value)} placeholder="+880 1XXXXXXXXX" className="flex-1 px-5 py-4 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/10 outline-none transition-all font-medium" />
                <button type="button" onClick={syncPresidentNumber} disabled={isSyncing} className="flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm">
                  <RefreshCw className={`size-5 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync President
                </button>
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-500" />
                Clicking sync automatically pulls the current President's number from the member directory.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm border border-emerald-100">
                <Wallet className="size-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Payment Methods</h3>
                <p className="text-slate-500 mt-1">Manage receiving accounts for membership fees.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPaymentMethods([...paymentMethods, { method: 'bKash', account_number: '' }])}
              className="flex items-center gap-2 bg-[#F26522]/10 text-[#F26522] px-6 py-3 rounded-2xl font-bold hover:bg-[#F26522]/20 transition-colors"
            >
              <Wallet className="size-4" /> Add Method
            </button>
          </div>
          
          <div className="p-8 space-y-6">
            {paymentMethods.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Wallet className="size-12 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No payment methods configured.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((pm, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:border-slate-300 transition-colors">
                    <div className="w-full sm:w-48 shrink-0 relative">
                      <select
                        value={pm.method}
                        onChange={(e) => {
                          const newMethods = [...paymentMethods];
                          newMethods[idx].method = e.target.value;
                          setPaymentMethods(newMethods);
                        }}
                        className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-[#F26522] outline-none appearance-none font-bold text-slate-700 bg-white"
                      >
                        <option value="bKash">bKash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Rocket">Rocket</option>
                        <option value="Bank">Bank</option>
                      </select>
                    </div>
                    <div className="w-full flex-1 flex flex-col sm:flex-row gap-4">
                      {pm.method === 'Bank' && (
                        <input
                          type="text"
                          placeholder="Bank Name (e.g. City Bank)"
                          value={pm.bank_name || ''}
                          onChange={(e) => {
                            const newMethods = [...paymentMethods];
                            newMethods[idx].bank_name = e.target.value;
                            setPaymentMethods(newMethods);
                          }}
                          className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-[#F26522] outline-none font-medium text-slate-700 bg-white"
                        />
                      )}
                      <input
                        type="text"
                        placeholder="Account Number"
                        value={pm.account_number}
                        onChange={(e) => {
                          const newMethods = [...paymentMethods];
                          newMethods[idx].account_number = e.target.value;
                          setPaymentMethods(newMethods);
                        }}
                        className="w-full flex-1 px-5 py-4 rounded-xl border border-slate-200 focus:border-[#F26522] outline-none font-medium text-slate-700 bg-white tracking-wide"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentMethods(paymentMethods.filter((_, i) => i !== idx))}
                      className="p-4 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Remove Method"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Global Background Media */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shadow-sm border border-purple-100">
              <MonitorPlay className="size-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Page Background Media</h3>
              <p className="text-slate-500 mt-1">Upload images or videos (mp4/webm) for page headers.</p>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {renderMediaUpload('Home Page Hero', 'home', 'bg_home', bgHome, setBgHome, 'image/*,video/mp4,video/webm')}
              {renderMediaUpload('Events Header', 'events', 'bg_events', bgEvents, setBgEvents, 'image/*,video/mp4,video/webm')}
              {renderMediaUpload('News Header', 'news', 'bg_news', bgNews, setBgNews, 'image/*,video/mp4,video/webm')}
              {renderMediaUpload('Gallery Header', 'gallery', 'bg_gallery', bgGallery, setBgGallery, 'image/*,video/mp4,video/webm')}
              {renderMediaUpload('Members Header', 'members', 'bg_members', bgMembers, setBgMembers, 'image/*,video/mp4,video/webm')}
              {renderMediaUpload('About Header', 'about', 'bg_about_header', bgAboutHeader, setBgAboutHeader, 'image/*,video/mp4,video/webm')}
            </div>
          </div>
        </div>

        {/* About Page Media */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm border border-indigo-100">
              <MonitorPlay className="size-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">About Page Media</h3>
              <p className="text-slate-500 mt-1">Upload images for Mission, Vision, and Journey cards.</p>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {renderMediaUpload('Mission Background', 'mission', 'bg_mission', bgMission, setBgMission)}
              {renderMediaUpload('Vision Background', 'vision', 'bg_vision', bgVision, setBgVision)}
              {renderMediaUpload('Journey Image 1', 'journey1', 'bg_journey_1', bgJourney1, setBgJourney1)}
              {renderMediaUpload('Journey Image 2', 'journey2', 'bg_journey_2', bgJourney2, setBgJourney2)}
              {renderMediaUpload('Journey Image 3', 'journey3', 'bg_journey_3', bgJourney3, setBgJourney3)}
              {renderMediaUpload('Journey Image 4', 'journey4', 'bg_journey_4', bgJourney4, setBgJourney4)}
              {renderMediaUpload('Journey Image 5', 'journey5', 'bg_journey_5', bgJourney5, setBgJourney5)}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="sticky bottom-8 flex justify-end pt-4 z-40">
          <button type="submit" disabled={isSaving || Object.values(uploadingMedia).some(Boolean)} className="flex items-center gap-3 px-10 py-5 rounded-2xl font-bold bg-[#F26522] text-white hover:bg-[#E05412] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-[#F26522]/30 text-lg">
            {isSaving ? <Loader2 className="size-6 animate-spin" /> : <Save className="size-6" />}
            {isSaving ? 'Saving Configurations...' : 'Save All Settings'}
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Save Global Settings"
        message="Are you sure you want to save these configurations? Changes will take effect immediately across the entire website."
        confirmText="Save Changes"
        requireText="save"
        isDestructive={false}
        onConfirm={handleSave}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  )
}
