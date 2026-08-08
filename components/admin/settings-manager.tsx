'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Phone, CalendarClock, RefreshCw, MonitorPlay, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function SettingsManager() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [settingsId, setSettingsId] = useState<string | null>(null)

  // Settings State
  const [isRecruitmentOpen, setIsRecruitmentOpen] = useState(false)
  const [recruitmentStart, setRecruitmentStart] = useState('')
  const [recruitmentEnd, setRecruitmentEnd] = useState('')
  const [officialContact, setOfficialContact] = useState('')

  // Background Media State
  const [bgHome, setBgHome] = useState('')
  const [bgEvents, setBgEvents] = useState('')
  const [bgNews, setBgNews] = useState('')
  const [bgGallery, setBgGallery] = useState('')
  const [bgMembers, setBgMembers] = useState('')
  const [bgMission, setBgMission] = useState('')
  const [bgVision, setBgVision] = useState('')
  const [bgJourney1, setBgJourney1] = useState('')
  const [bgJourney2, setBgJourney2] = useState('')
  const [bgJourney3, setBgJourney3] = useState('')
  const [bgJourney4, setBgJourney4] = useState('')
  const [bgJourney5, setBgJourney5] = useState('')
  const [bgFiles, setBgFiles] = useState<{ [key: string]: File | null }>({
    home: null,
    events: null,
    news: null,
    gallery: null,
    members: null,
    mission: null,
    vision: null,
    journey1: null,
    journey2: null,
    journey3: null,
    journey4: null,
    journey5: null,
  })

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
        
        setOfficialContact(data.official_contact_number || '')
        setBgHome(data.bg_home || '')
        setBgEvents(data.bg_events || '')
        setBgNews(data.bg_news || '')
        setBgGallery(data.bg_gallery || '')
        setBgMembers(data.bg_members || '')
        setBgMission(data.bg_mission || '')
        setBgVision(data.bg_vision || '')
        setBgJourney1(data.bg_journey_1 || '')
        setBgJourney2(data.bg_journey_2 || '')
        setBgJourney3(data.bg_journey_3 || '')
        setBgJourney4(data.bg_journey_4 || '')
        setBgJourney5(data.bg_journey_5 || '')
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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSaving(true)

    try {
      let newBgHome = bgHome
      let newBgEvents = bgEvents
      let newBgNews = bgNews
      let newBgGallery = bgGallery
      let newBgMembers = bgMembers
      let newBgMission = bgMission
      let newBgVision = bgVision
      let newBgJourney1 = bgJourney1
      let newBgJourney2 = bgJourney2
      let newBgJourney3 = bgJourney3
      let newBgJourney4 = bgJourney4
      let newBgJourney5 = bgJourney5

      const uploadMedia = async (file: File | null, prefix: string) => {
        if (!file) return null
        const ext = file.name.split('.').pop()
        const filename = `${prefix}_${Date.now()}.${ext}`
        const { data, error } = await supabase.storage.from('jef-images').upload(`settings/${filename}`, file)
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from('jef-images').getPublicUrl(data.path)
        return publicUrl
      }

      if (bgFiles.home) newBgHome = await uploadMedia(bgFiles.home, 'bg_home') || newBgHome
      if (bgFiles.events) newBgEvents = await uploadMedia(bgFiles.events, 'bg_events') || newBgEvents
      if (bgFiles.news) newBgNews = await uploadMedia(bgFiles.news, 'bg_news') || newBgNews
      if (bgFiles.gallery) newBgGallery = await uploadMedia(bgFiles.gallery, 'bg_gallery') || newBgGallery
      if (bgFiles.members) newBgMembers = await uploadMedia(bgFiles.members, 'bg_members') || newBgMembers
      if (bgFiles.mission) newBgMission = await uploadMedia(bgFiles.mission, 'bg_mission') || newBgMission
      if (bgFiles.vision) newBgVision = await uploadMedia(bgFiles.vision, 'bg_vision') || newBgVision
      if (bgFiles.journey1) newBgJourney1 = await uploadMedia(bgFiles.journey1, 'bg_journey_1') || newBgJourney1
      if (bgFiles.journey2) newBgJourney2 = await uploadMedia(bgFiles.journey2, 'bg_journey_2') || newBgJourney2
      if (bgFiles.journey3) newBgJourney3 = await uploadMedia(bgFiles.journey3, 'bg_journey_3') || newBgJourney3
      if (bgFiles.journey4) newBgJourney4 = await uploadMedia(bgFiles.journey4, 'bg_journey_4') || newBgJourney4
      if (bgFiles.journey5) newBgJourney5 = await uploadMedia(bgFiles.journey5, 'bg_journey_5') || newBgJourney5

      const payload = {
        is_recruitment_open: isRecruitmentOpen,
        recruitment_start: recruitmentStart ? new Date(recruitmentStart).toISOString() : null,
        recruitment_end: recruitmentEnd ? new Date(recruitmentEnd).toISOString() : null,
        official_contact_number: officialContact,
        bg_home: newBgHome,
        bg_events: newBgEvents,
        bg_news: newBgNews,
        bg_gallery: newBgGallery,
        bg_members: newBgMembers,
        bg_mission: newBgMission,
        bg_vision: newBgVision,
        bg_journey_1: newBgJourney1,
        bg_journey_2: newBgJourney2,
        bg_journey_3: newBgJourney3,
        bg_journey_4: newBgJourney4,
        bg_journey_5: newBgJourney5,
      }

      if (settingsId) {
        const { error } = await supabase.from('site_settings').update(payload).eq('id', settingsId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('site_settings').insert([payload]).select().single()
        if (error) throw error
        if (data) setSettingsId(data.id)
      }
      
      toast.success('Site settings saved successfully!')
    } catch (err: any) {
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

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="size-10 animate-spin mx-auto text-[#F26522] mb-4" />
        <p className="text-lg font-semibold text-navy">Loading configurations...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold text-navy tracking-tight">Site Settings</h2>
        <p className="text-muted-foreground mt-1">Configure global platform configurations like recruitments and contacts.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Recruitment Timer Settings */}
        <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border bg-secondary/30 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
              <CalendarClock className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-navy">Member Recruitment Timer</h3>
              <p className="text-sm text-muted-foreground">Control when people can apply to join the club.</p>
            </div>
          </div>
          
          <div className="p-8 space-y-8">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative flex items-center mt-1">
                <input type="checkbox" checked={isRecruitmentOpen} onChange={e => setIsRecruitmentOpen(e.target.checked)} className="peer sr-only" />
                <div className="w-14 h-7 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
              </div>
              <div>
                <span className="text-lg font-bold text-navy group-hover:text-green-600 transition-colors">Recruitment is Open</span>
                <p className="text-sm text-muted-foreground mt-1">When turned on, the recruitment form will be accessible to visitors. When off, the form is hidden or disabled.</p>
              </div>
            </label>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 transition-opacity duration-300 ${isRecruitmentOpen ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Start Date & Time</label>
                <input type="datetime-local" value={recruitmentStart} onChange={e => setRecruitmentStart(e.target.value)} disabled={!isRecruitmentOpen} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all disabled:bg-secondary" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">End Date & Time</label>
                <input type="datetime-local" value={recruitmentEnd} onChange={e => setRecruitmentEnd(e.target.value)} disabled={!isRecruitmentOpen} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all disabled:bg-secondary" />
              </div>
            </div>
          </div>
        </div>

        {/* Global Contact Info */}
        <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border bg-secondary/30 flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 text-orange-600 rounded-xl">
              <Phone className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-navy">Official Contact Information</h3>
              <p className="text-sm text-muted-foreground">The primary phone number shown on the website footer and contact pages.</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Official Contact Number</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <input type="tel" value={officialContact} onChange={e => setOfficialContact(e.target.value)} placeholder="+880 1..." className="flex-1 px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                <button type="button" onClick={syncPresidentNumber} disabled={isSyncing} className="flex items-center justify-center gap-2 bg-secondary text-navy px-6 py-3 rounded-xl font-bold hover:bg-secondary/70 transition-colors disabled:opacity-50">
                  <RefreshCw className={`size-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync with President
                </button>
              </div>
              <p className="text-xs text-muted-foreground">This number is public. Clicking sync will find the current President in the member directory and copy their number.</p>
            </div>
          </div>
        </div>

        {/* Global Background Media */}
        <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border bg-secondary/30 flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
              <MonitorPlay className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-navy">Page Background Media</h3>
              <p className="text-sm text-muted-foreground">Upload images or videos (mp4/webm) for the headers of different pages.</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: 'Home Page Hero', key: 'home', state: bgHome, setFile: (f: File | null) => setBgFiles(p => ({ ...p, home: f })), file: bgFiles.home, setBg: setBgHome },
                { label: 'Events Page Header', key: 'events', state: bgEvents, setFile: (f: File | null) => setBgFiles(p => ({ ...p, events: f })), file: bgFiles.events, setBg: setBgEvents },
                { label: 'News Page Header', key: 'news', state: bgNews, setFile: (f: File | null) => setBgFiles(p => ({ ...p, news: f })), file: bgFiles.news, setBg: setBgNews },
                { label: 'Gallery Page Header', key: 'gallery', state: bgGallery, setFile: (f: File | null) => setBgFiles(p => ({ ...p, gallery: f })), file: bgFiles.gallery, setBg: setBgGallery },
                { label: 'Members Page Header', key: 'members', state: bgMembers, setFile: (f: File | null) => setBgFiles(p => ({ ...p, members: f })), file: bgFiles.members, setBg: setBgMembers },
              ].map(item => (
                <div key={item.key} className="space-y-2 border border-border rounded-xl p-4 bg-secondary/20 relative">
                  <label className="text-xs font-bold uppercase text-navy">{item.label}</label>
                  
                  {item.file ? (
                    <div className="text-xs text-[#F26522] font-semibold break-words">Ready to upload: {item.file.name}</div>
                  ) : item.state ? (
                    <div className="text-xs text-green-600 font-semibold break-all truncate">Current: {item.state.split('/').pop()}</div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No media set</div>
                  )}

                  <input 
                    type="file" 
                    accept="image/*,video/mp4,video/webm"
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        item.setFile(e.target.files[0])
                      }
                    }} 
                    className="w-full text-xs mt-2 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F26522]/10 file:text-[#F26522] hover:file:bg-[#F26522]/20 cursor-pointer"
                  />
                  {(item.file || item.state) && (
                    <button 
                      type="button" 
                      onClick={() => { item.setFile(null); item.setBg('') }} 
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1 rounded-full transition-colors"
                      title="Remove Media"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* About Page Media */}
        <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border bg-secondary/30 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl">
              <MonitorPlay className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-navy">About Page Media</h3>
              <p className="text-sm text-muted-foreground">Upload images for Mission, Vision, and Journey cards.</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: 'Mission Background', key: 'mission', state: bgMission, setFile: (f: File | null) => setBgFiles(p => ({ ...p, mission: f })), file: bgFiles.mission, setBg: setBgMission },
                { label: 'Vision Background', key: 'vision', state: bgVision, setFile: (f: File | null) => setBgFiles(p => ({ ...p, vision: f })), file: bgFiles.vision, setBg: setBgVision },
                { label: 'Journey Image 1', key: 'journey1', state: bgJourney1, setFile: (f: File | null) => setBgFiles(p => ({ ...p, journey1: f })), file: bgFiles.journey1, setBg: setBgJourney1 },
                { label: 'Journey Image 2', key: 'journey2', state: bgJourney2, setFile: (f: File | null) => setBgFiles(p => ({ ...p, journey2: f })), file: bgFiles.journey2, setBg: setBgJourney2 },
                { label: 'Journey Image 3', key: 'journey3', state: bgJourney3, setFile: (f: File | null) => setBgFiles(p => ({ ...p, journey3: f })), file: bgFiles.journey3, setBg: setBgJourney3 },
                { label: 'Journey Image 4', key: 'journey4', state: bgJourney4, setFile: (f: File | null) => setBgFiles(p => ({ ...p, journey4: f })), file: bgFiles.journey4, setBg: setBgJourney4 },
                { label: 'Journey Image 5', key: 'journey5', state: bgJourney5, setFile: (f: File | null) => setBgFiles(p => ({ ...p, journey5: f })), file: bgFiles.journey5, setBg: setBgJourney5 },
              ].map(item => (
                <div key={item.key} className="space-y-2 border border-border rounded-xl p-4 bg-secondary/20 relative">
                  <label className="text-xs font-bold uppercase text-navy">{item.label}</label>
                  
                  {item.file ? (
                    <div className="text-xs text-[#F26522] font-semibold break-words">Ready to upload: {item.file.name}</div>
                  ) : item.state ? (
                    <div className="text-xs text-green-600 font-semibold break-all truncate">Current: {item.state.split('/').pop()}</div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No media set</div>
                  )}

                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        item.setFile(e.target.files[0])
                      }
                    }} 
                    className="w-full text-xs mt-2 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F26522]/10 file:text-[#F26522] hover:file:bg-[#F26522]/20 cursor-pointer"
                  />
                  {(item.file || item.state) && (
                    <button 
                      type="button" 
                      onClick={() => { item.setFile(null); item.setBg('') }} 
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1 rounded-full transition-colors"
                      title="Remove Media"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-10 py-4 rounded-xl font-bold bg-[#F26522] text-white hover:bg-[#F26522]/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-[#F26522]/20">
            {isSaving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
            {isSaving ? 'Saving Configurations...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
